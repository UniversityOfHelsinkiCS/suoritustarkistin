# courses.mooc.fi batch API — deviations from the spec

Suotar's implementation of the [courses.mooc.fi API proposal](https://gist.github.com/nygrenh/3d505fff6d747d550b0c2d63a824bfbb)
does not follow it exactly. Every difference is recorded here: what we do instead, and why.

Anything not listed here follows the spec as written.

The recurring reason behind several of these is worth stating once. Suotar does not read Sisu
directly — it reads a copy that is refreshed periodically, and an attainment or enrolment can
take up to about an hour to appear in it. Everything Suotar tells you about the state of Sisu
is subject to that delay, including section 4 verify.

## Added result codes

### `submissionPending` (section 3)

An import item whose `requestItemId` was submitted less than **two hours** ago is refused
rather than submitted to Sisu again.

The spec asks courses.mooc.fi to verify before retrying a `sisuTimeout`, so as not to risk a
double submission. Because of the delay above, that is not possible: for up to an hour after a
submission, verify will answer `notRegistered` for an attainment that does exist, and a client
polling every few minutes would submit a second one. Suotar is the only party that knows
immediately what it has already submitted, so the wait is enforced here instead.

**Response**

```json
[
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
]
```

A `result` on an error item is itself an extension. It carries the attainment id so you can
keep verifying during the wait, and `retryAfter` so you need not guess when to come back.

**What does and does not start the wait.** Only a completion that actually reached Sisu. If
Suotar rejected it — `courseNotAllowed`, `personNotFound`, `enrolmentNotFound`,
`invalidCredits`, `invalidGradeForGradeScale`, `studyRightNotValid` — nothing was submitted,
and a corrected retry is accepted immediately.

| first outcome          | retry within 2 h         | retry after 2 h                                                  |
| ---------------------- | ------------------------ | ---------------------------------------------------------------- |
| `sisuTimeout`          | `submissionPending`      | accepted; answered `duplicateAttainment` if the first one landed |
| `sent`                 | `submissionPending`      | accepted; answered `duplicateAttainment`                         |
| `sisuValidationFailed` | **accepted immediately** | —                                                                |

`sisuValidationFailed` is exempt because Sisu looked at the attainment and refused it, so
nothing exists that a retry could duplicate. Send the corrected data straight away.

Two hours is chosen so that by the time a retry is accepted, Sisu's data has reached Suotar
and the duplicate check is trustworthy again. That check is what protects a retry after a
`sisuTimeout` whose first attempt did in fact succeed.

## Changed responses

### `sisuTimeout` carries `submittedAttainmentId` (section 3)

The spec's `sisuTimeout` example returns only `requestItemId`, `status`, `code` and
`error.message`, while section 4 verify needs a `submittedAttainmentId`. As specified you are
told to verify and given nothing to verify with.

Suotar chooses the attainment id itself and sends it to Sisu, so the id exists whatever the
outcome. We return it:

```json
{
  "requestItemId": "moocfi-completion-12345",
  "status": "error",
  "code": "sisuTimeout",
  "error": { "message": "Sisu operation timed out; outcome is uncertain." },
  "result": {
    "submittedAttainmentId": "hy-kur-...",
    "submittedAttainmentType": "AssessmentItemAttainment"
  }
}
```

### `sisuTemporarilyUnavailable` on section 2

Section 2 does not list this code, unlike sections 1, 4 and 6, but Suotar returns it there
when it cannot reach Sisu. The alternative is failing the whole request, which would lose
every `requestItemId` and tell you nothing per item.

### `studyRightValidityPeriod` may be absent (section 2)

An enrolment whose study right did not resolve is still returned as `enrolmentFound`, with
`studyRightValidityPeriod` omitted. The enrolment is real and usable, and the spec has no code
for "found, but its study right did not resolve".

## Behaviour the spec leaves open

### `courseUnitRealisationId` is an optional filter (section 6)

The spec's example always sends it but never marks it required. Omit it and you get every
enrolled person on the course code; include it and you get only that realisation. A
realisation nobody is enrolled on returns `enrolmentsListed` with an empty `people` list, not
`courseCodeNotFound` — the course code did resolve.

### An item missing a required field fails the whole request

The spec defines `malformedRequest` for a body that is not a JSON array of items. Suotar also
uses it for an item missing a field the endpoint needs — no `studentNumber`, no `courseCode`,
an empty `courseUnitRealisationId` — and for a batch containing the same `requestItemId`
twice. The per-item codes describe outcomes for a well-formed item, so answering
`personNotFound` for an item that carried no student number would be misleading.

### Batch size limit

At most **100** items per request for importing attainments (section 3), and **1000** for every other endpoint. Larger
batches are refused with `malformedRequest`.

Section 3 is lower because registering completions needs several lookups against Sisu's data
that Suotar has to make in sequence, so the time a batch takes grows with its size and a large
one risks running past your client's timeout — the worst outcome available, since it leaves you
unsure whether the completions were submitted. A hundred keeps a request comfortably inside a
normal timeout, and a failure then costs you one small batch rather than a large one. Section 2
costs about as much per item, but it only reads: a request that times out there can simply be
sent again, so it keeps the higher limit.

### `kind` is derived, not read (section 2)

Sisu has no field for it. Suotar infers `openUniversity` or `degree` from the study right,
using the same convention as the rest of the system.

### `enrolmentId` is honoured exactly (section 3)

The attainment is registered against the enrolment you named in section 2. Suotar's other
integrations instead pick an enrolment by matching the attainment date against realisation
activity periods; for a course with both a degree and an open university realisation the two
disagree, and your choice wins.

### What counts as an improved grade (section 3)

The spec defines `notImprovedAttainment` without saying how the comparison is made. Suotar
requires the completion to beat **every** attainment the student already holds **on that course
code** — not merely the most recent one. An attainment is beaten by a better grade, or by the
same grade with more credits, or by the same grade and credits with a later attainment date.
Attainments Sisu has marked as misregistrations are ignored, and attainments on other courses
never affect the answer.

The `previousAttainment` returned with the code is the student's most recent attainment on the
course. Where several attainments are in play, that is not necessarily the one the comparison
failed against.

## Known limitations

### `enrolmentNotAccepted` cannot currently occur (section 2)

Suotar only ever sees enrolments in state `ENROLLED`, so a student whose enrolment has not
been accepted is indistinguishable from one with no enrolment, and you will get
`enrolmentNotFound`. The code is implemented and will start working once that limitation is
lifted; there is no client change needed when it does.

### The registered attainment date may differ from the one you sent

Sisu rejects attainments dated outside the student's study right, so Suotar moves the date
into range where necessary. The response does not currently tell you the date actually
registered.

### A course must be added to Suotar before it can be registered

`courseNotAllowed` means the course code is not in Suotar's own course list, which a Suotar
admin maintains by hand. Sisu knowing the course is not enough — until someone adds it, every
import for that code is refused, so a new course needs arranging before its first completion
is submitted.

This is not only friction: the course list doubles as the allowlist of what courses.mooc.fi is
permitted to register, and it is currently the only thing stopping an API key from registering
completions against arbitrary course codes across the university. Whether it stays a manual
step long term is open — the alternatives trade that gate for convenience, so the question is
what should replace it rather than whether to drop it. Deferred for now.

### `acceptorNotFound` cannot currently occur (section 3)

Every Sisu attainment names its acceptors, but Suotar does not choose them: they are the course
unit realisation's own teachers and responsible teachers, all of them, looked up when the
attainment is sent. Nothing in an import item, and nothing about how a course is configured in
Suotar, affects who they are.

So there is no lookup here that can fail, and the code is never returned. It stays defined in
case that changes.

The practical consequence is that a realisation with no teacher on it cannot take an
attainment. That surfaces as `sisuValidationFailed` on the item, since it is Sisu that
refuses it, and it affects only the items on that realisation.

### Elements of AI and Building AI are not covered yet

Those three courses have their own registration paths in Suotar's automated jobs — separate
scripts, chosen by course code, with handling that differs from an ordinary MOOC course. How
they should behave through this API has not been worked out, so their course codes are refused
with `courseNotAllowed` for now. Temporary — the block is lifted once it is settled.

### Section 5 is not implemented

Open University product access tokens have no source in the data Suotar can reach. Delivering
them is a separate project. The other five endpoints do not depend on it.

### Section 6 returns every enrolled person

Email addresses are returned for all of them. Suotar does not filter on Sisu's non-disclosure
flag, as the addresses are required to register completions.

## What we assume about your side

### `requestItemId` is stable across retries for section 3

The spec says only that it is set by courses.mooc.fi and echoed back. The two-hour wait, and
therefore the protection against double submission, works only if a retry carries the same id
as the original. The section 3 example value `moocfi-completion-12345` suggests a durable
completion id rather than the per-request handles in sections 1 and 2 — but if your client
generates a fresh id per request, the protection silently does nothing. **Please confirm.**

### Enrolments come from Sisu only

Suotar's older integrations also consult eduweb, which is being retired. This API does not. An
enrolment that exists in eduweb but not in Sisu is `enrolmentNotFound` here.

## Open questions

1. `submissionPending` needs adding to section 3, and clients need to handle it.
2. Section 4's polling guidance assumes verify is current, and it can be up to an hour behind.
   The diagram's "attainment shows up in Sisu a few minutes later" is optimistic — expect a
   longer wait, and consider polling with backoff rather than a fixed few-minute interval.
3. Is `requestItemId` stable across retries for section 3?
4. Should the response report the attainment date actually registered?
