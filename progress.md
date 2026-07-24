Original prompt: Build the EduForge/TokenHack hackathon app using a four-person branch plan, with Person A owning frontend/design and Persons B-D owning backend areas, so branches can merge cleanly later.

## Progress

- Created SOTA four-person execution plan.
- Defined branch names, ownership, shared contracts, event types, API routes, merge order, source repositories, and acceptance criteria.
- Added detailed docs for Person A through Person D.
- Person B: scaffolded the Next.js app and `src/contracts` from the frozen contract doc.
- Person B: implemented the deterministic upload-to-variants core loop with all
  five owned agents, the seed cohort, the run store, and the runs/students/rooms
  routes. Lint, typecheck, 61 tests, and build all pass.

## Next Steps

- Person D: event bus and SSE. Register a sink via `registerEventBus` or
  `globalThis[Symbol.for("eduforge.eventBus")]`; no import of Person B code needed.
- Person C: assessment, mastery updates, and lesson plan on top of `RunState`
  (`assessments`, `lesson_plan`, `review_queue` are already carried).
- Person A: frontend world against the live API surface.
- Merge in the documented order: D, B, C, A, then `integration/demo-polish`.
