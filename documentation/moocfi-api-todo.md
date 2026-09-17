# courses.mooc.fi batch API — todo

Work the implementation owes. Client-facing behaviour belongs in
[moocfi-api-spec.md](moocfi-api-spec.md), not here.

## Batch section 6's lookup in the importer

Section 6 is one unbounded GET per distinct course code: `getCourseUnitEnrolments` fetches every
enrolment the code ever had and trims to the last two months in Suotar, so the trim shrinks only
what reaches mooc.fi. A new importer route taking an array of course codes and bounding the
activity period in the query settles three things at once:

- the importer response, the transfer and the parse shrink to the window, not just the output
- one round trip per batch instead of one per code, so the 1000-item limit stops meaning 1000
  sequential GETs
- the importer resolves the course code already (`CourseUnit.findAll({ where: { code } })`) and
  discards the result, so it can report an unknown code separately from a code with no
  realisations in the window — which is what stops section 6 answering `courseCodeNotFound` for a
  dormant course

The third only holds if the response keeps those two apart per code. Returning realisations
independently of their enrolments, rather than grouping by enrolment as the current route does,
also lets a realisation nobody is on come back as an empty `people` list.

Decide while writing it: `isActiveRealisation` drops a realisation with no
`activityPeriod.endDate`, silently losing an open-ended one. In SQL it should probably be kept.

`getCourseUnitEnrolments` stays for its existing callers (`moocRegistrations.js`,
`rawEntryController.js`); migrating those is separate work.
