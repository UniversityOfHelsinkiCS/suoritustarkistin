# courses.mooc.fi batch API — deviations from the spec

Suotar's implementation of the [courses.mooc.fi API proposal](https://gist.github.com/nygrenh/3d505fff6d747d550b0c2d63a824bfbb)
does not follow it exactly. Every difference is recorded here; anything not listed follows the
spec as written. Section numbers in the headings are the spec's.

One cause recurs: Suotar reads not Sisu but a copy refreshed periodically, so an attainment or
enrolment can take up to about an hour to appear. Everything Suotar tells you about Sisu is
subject to that delay, section 4 verify included.

## Added result codes

### `submissionPending` (3)

An item whose `requestItemId` was submitted less than **two hours** ago is refused rather than
sent to Sisu again.

The spec has courses.mooc.fi verify before retrying a `sisuTimeout`, which the delay above makes
impossible: for up to an hour verify answers `notRegistered` for an attainment that does exist,
and a client polling every few minutes would submit a second one. Only Suotar knows immediately
what it has already submitted. Two hours also means Sisu's data has reached Suotar by the time a
retry is accepted, so the duplicate check — what protects a retry whose first attempt did land —
is trustworthy again.

```json
{
  "requestItemId": "moocfi-completion-12345",
  "status": "error",
  "code": "submissionPending",
  "error": {
    "message": "This completion was submitted recently and its outcome is not yet confirmed. Verify before retrying."
  },
  "result": {
    "submittedAttainmentId": "hy-kur-...",
    "submittedAttainmentType": "AssessmentItemAttainment",
    "retryAfter": "2026-09-01T14:32:00Z"
  }
}
```

A `result` on an error item is itself an extension: the id lets you keep verifying during the
wait, `retryAfter` saves you guessing when to return.

Only a completion that reached Sisu starts the wait. A rejection — `courseNotAllowed`,
`personNotFound`, `enrolmentNotFound`, `invalidCredits`, `invalidGradeForGradeScale`,
`studyRightNotValid` — submitted nothing, so a corrected retry is accepted immediately.

| first outcome          | retry within 2 h         | retry after 2 h                                                  |
| ---------------------- | ------------------------ | ---------------------------------------------------------------- |
| `sisuTimeout`          | `submissionPending`      | accepted; answered `duplicateAttainment` if the first one landed |
| `sent`                 | `submissionPending`      | accepted; answered `duplicateAttainment`                         |
| `sisuValidationFailed` | **accepted immediately** | —                                                                |

`sisuValidationFailed` is exempt because Sisu saw the attainment and refused it: nothing exists
that a retry could duplicate.

-> pending status to verify (§4) instead of here

## Changed responses

### `sisuTimeout` carries `submittedAttainmentId` (3)

The spec's example returns only `requestItemId`, `status`, `code` and `error.message`, while
section 4 needs a `submittedAttainmentId` — you are told to verify and given nothing to verify
with. Suotar picks the attainment id itself and sends it to Sisu, so it exists whatever the
outcome, and returns it in a `result` with `submittedAttainmentId` and
`submittedAttainmentType`, exactly as `sent` does.

### `serviceTemporarilyUnavailable` is request-level (1, 2, 3, 4, 6)

Renamed from the spec's per-item `sisuTemporarilyUnavailable`, and answered as a request-level
error with HTTP 503 rather than as a result per item:

```json
{
  "error": {
    "code": "serviceTemporarilyUnavailable",
    "message": "Failed to fetch Sisu data."
  }
}
```

Every lookup behind these endpoints is batch-wide — one call resolves the persons for the whole
batch, one the enrolments, and so on — so an importer that cannot answer leaves no item with an
outcome of its own. Repeating the same code across every `requestItemId` said nothing the
request-level error does not, and made "some items failed" indistinguishable from "the request
failed" at the status code. Retry the whole batch; section 3 is safe to retry because it writes
nothing unless every item resolved.

Section 3 also answers it, which the spec does not list it for.

### `studyRightValidityPeriod` may be absent (2)

An enrolment whose study right did not resolve is still `enrolmentFound`, with the field
omitted. The enrolment is real and usable, and the spec has no code for "found, but its study
right did not resolve".

## Behaviour the spec leaves open

### `courseUnitRealisationId` is an optional filter (6)

The spec's example always sends it but never marks it required. Omit it for every enrolled
person on the course code, include it for one realisation. A realisation nobody is enrolled on
is `enrolmentsListed` with an empty `people` list, not `courseCodeNotFound` — the course code
did resolve.

-> ditch realisationId, time limit 2months

### A malformed item fails the whole request

The spec defines `malformedRequest` for a body that is not a JSON array of items. Suotar also
uses it for an item missing a field the endpoint needs — no `studentNumber`, no `courseCode`, an
empty `courseUnitRealisationId` — and for a repeated `requestItemId`. The per-item codes describe
outcomes for a well-formed item, so `personNotFound` for an item carrying no student number
would mislead.

### Batch size limit

At most **100** items for importing attainments (3), **1000** elsewhere; larger batches are
refused with `malformedRequest`. Section 3 is lower because registering needs several sequential
lookups per item, so a large batch risks running past your client's timeout — the worst outcome
available, since it leaves you unsure whether the completions were submitted. Section 2 costs
about as much per item but only reads: a timeout there can simply be retried, so it keeps the
higher limit.

-> add limits to spec

## Known limitations

### `enrolmentNotAccepted` cannot currently occur (2)

Suotar only ever sees enrolments in state `ENROLLED`, so an unaccepted enrolment is
indistinguishable from none and you get `enrolmentNotFound`. The code is implemented and starts
working once that limitation is lifted, with no client change needed.

-> update spec to match

### The registered attainment date may differ from the one you sent

Sisu rejects attainments dated outside the student's study right, so Suotar moves the date into
range where necessary. The response does not currently tell you the date registered.

-> mention in spec?

### A course must be added to Suotar before it can be registered

`courseNotAllowed` means the course code is not in Suotar's own course list, which an admin
maintains by hand; Sisu knowing the course is not enough, so a new course needs arranging before
its first completion is submitted.

-> endpoint for checking course codes validity

### Elements of AI and Building AI are not covered yet

Those three courses have their own registration paths in Suotar's automated jobs — separate
scripts, chosen by course code, handling that differs from an ordinary MOOC course. How they
should behave through this API is not worked out, so their course codes are refused with
`courseNotAllowed` for now. Temporary.

-> figure out BAI rules and move them to mooc?

### Section 5 is not implemented

Open University product access tokens have no source in the data Suotar can reach; delivering
them is a separate project. The other five endpoints do not depend on it.

## What we assume about your side

### `requestItemId` is stable across retries for section 3

The spec says only that it is set by courses.mooc.fi and echoed back. The two-hour wait, and so
the protection against double submission, works only if a retry carries the same id as the
original. The section 3 example value `moocfi-completion-12345` suggests a durable completion id
rather than the per-request handles in sections 1 and 2 — but a client generating a fresh id per
request silently loses the protection. **Please confirm.**

### Enrolments come from Sisu only

Suotar's older integrations also consult eduweb, which is being retired. This API does not. An
enrolment in eduweb but not in Sisu is `enrolmentNotFound` here.

## Open questions

1. `submissionPending` needs adding to section 3, and clients need to handle it.
2. Section 4's polling guidance assumes verify is current, and it can be up to an hour behind.
   The diagram's "attainment shows up in Sisu a few minutes later" is optimistic — expect longer,
   and consider backoff rather than a fixed few-minute interval.
3. Is `requestItemId` stable across retries for section 3?
4. Should the response report the attainment date registered?
