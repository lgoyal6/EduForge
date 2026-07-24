# Person B: Backend Core Loop

Branch: `person-b/backend-core-loop`

## Mission

Build the deterministic upload-to-assignment-variants loop.

This branch turns a professor assignment into:

- Extracted concepts.
- Relevant student context.
- Temporary learning rooms.
- Accessibility delivery layers.
- Room and student assignment variants.

## Owned Folders

- `src/seed/students.ts`
- `src/seed/assignment.ts`
- `src/server/runStore.ts`
- `src/server/agents/assignmentArchitect.ts`
- `src/server/agents/studentMemory.ts`
- `src/server/agents/grouping.ts`
- `src/server/agents/accessibility.ts`
- `src/server/agents/assignmentCurator.ts`
- `src/app/api/runs/**` except assessment-specific nested routes owned by Person C and SSE owned by Person D.
- `src/app/api/students/**`
- `src/app/api/rooms/**`

## Agents

### Assignment Architect

Consumes:

- `assignment.uploaded`

Publishes:

- `assignment.concepts.extracted`

Output:

- Concepts.
- Question-to-concept mappings.
- Difficulty.
- Time expectation.
- Professor constraints.

### Student Memory Agent

Consumes:

- `assignment.concepts.extracted`

Publishes:

- `student.context.ready`

Output:

- Student mastery for relevant concepts.
- Recent misconception evidence.
- Documented supports.
- Successful scaffolds.

### Grouping Agent

Consumes:

- `student.context.ready`

Publishes:

- `groups.proposed`

Logic:

```txt
room_fit =
  0.45 * concept_gap_similarity
+ 0.30 * misconception_similarity
+ 0.15 * mastery_band_similarity
+ 0.10 * support_compatibility
- fragmentation_penalty
```

Rules:

- Create 3 or 4 rooms.
- Minimum room size: 2.
- No diagnosis/accommodation-labeled rooms.
- Room explanations must cite evidence.

### Accessibility Agent

Consumes:

- `groups.proposed`

Publishes:

- `accessibility.layers.ready`

Rules:

- Supports modify presentation, pacing, visibility, and sequencing.
- Supports do not lower academic objectives.
- Changing documented supports is never automated.

### Assignment Curator

Consumes:

- `groups.proposed`
- `accessibility.layers.ready`

Publishes:

- `assignment.variants.ready`

Output:

- Room-level assignment variant.
- Student-level presentation overlays.
- Objective preservation check.
- Rigor check.

## Seed Scenario

Students: 15 synthetic Algebra I students.

Concepts:

- `integer_operations`
- `distributive_property`
- `equation_sequencing`
- `combining_like_terms`

Rooms:

- Ember: repeated sign errors in integer operations.
- Forge: partial distribution to only one term.
- Harbor: correct ideas in wrong operation order.
- Summit: above 85 percent mastery, extension problems.

## API Routes

### `POST /api/runs`

Input:

- Assignment file or demo assignment ID.
- Optional teaching intent.
- Demo mode flag.

Output:

- `run_id`
- initial `RunState`

Behavior:

- In demo mode, use seed assignment.
- Emit `assignment.uploaded`.
- Run Assignment Architect.
- Run Student Memory Agent.
- Run Grouping Agent.
- Run Accessibility Agent.
- Run Assignment Curator.

### `GET /api/runs/:runId`

Returns full current state.

### `GET /api/students/:studentId`

Returns private contextual card data.

### `GET /api/rooms/:roomId`

Returns focus, evidence, members, and assignment variant.

## Done Checklist

- [x] Deterministic run creation works.
- [x] All five owned agents return Zod-validated envelopes.
- [x] Room grouping is deterministic and explainable.
- [x] Assignment variants preserve objectives.
- [x] Branch emits events through Person D event bus when integrated.
- [x] Branch has local fallback event collector if Person D branch is not merged yet.

## Completion Notes

### What was completed

The full upload-to-variants loop runs end to end from a fixed seed:

`assignment.uploaded` → `assignment.concepts.extracted` → `student.context.ready`
→ `groups.proposed` → `accessibility.layers.ready` → `assignment.variants.ready`

- 15 synthetic Algebra I students over the four contract concepts.
- Four rooms built from the seed cohort: Ember 4, Forge 4, Harbor 4, Summit 3.
- All five agents return `AgentResult<T>` envelopes validated by Zod before the
  value reaches the run store or the bus.
- Endpoints: `POST /api/runs`, `GET /api/runs`, `GET /api/runs/:runId`,
  `GET /api/students/:studentId`, `GET /api/rooms/:roomId`.
- 61 tests across seed, core loop, grouping, accessibility, curator, event
  bridge, and route handlers.

### Scaffold created on this branch

The repository had no application scaffold when this branch started, so it was
created here: `package.json`, `tsconfig.json`, `next.config.ts`,
`eslint.config.mjs`, `vitest.config.ts`, and `src/contracts`.

`src/contracts` is the shared frozen surface from `docs/CONTRACTS.md`, written
verbatim where the doc specified a type. Two additions were required because
the doc referenced them without defining them: `SupportId` and `MisconceptionId`.
`Student.mastery` is spelled out key by key rather than as `z.record`, because
Zod infers a partial map from an enum key and the contract type is total.

Files added outside the owned list, all core-loop infrastructure:

| File | Why |
| --- | --- |
| `src/server/deterministic.ts` | Seeded clock, stable hashing, rounding. |
| `src/server/agentRuntime.ts` | Agent context and the envelope builder. |
| `src/server/eventBridge.ts` | Bus seam plus local fallback collector. |
| `src/server/coreLoop.ts` | Orchestration of the five agents. |
| `src/server/http.ts` | Shared route response and error shapes. |
| `src/server/views.ts` | Read models for the student and room routes. |

`src/server/events/**` was deliberately left untouched: it belongs to Person D.

### Integration seam for Person D

No cross-branch import is needed. Either call `registerEventBus(sink)` from
`src/server/eventBridge`, or assign a sink to
`globalThis[Symbol.for("eduforge.eventBus")]`. A sink is any object with
`publish(event: AgentEvent): void`. Every core-loop event is forwarded and also
mirrored locally, so the mirror keeps working as a replay and audit buffer. A
sink that throws is swallowed: the bus must never be able to break a run.

### Integration seam for Person C

`RunState` already carries `assessments`, `lesson_plan`, and `review_queue`.
`AssessmentResult` and `LessonPlan` are permissive passthrough schemas so
Person C can tighten them without a contract renegotiation. Run status stops at
`variants_ready`; `assessed` and `planned` are Person C's transitions. Mutate
run state through `updateRun` / `appendRunEvent` in `src/server/runStore.ts` so
event sequencing and deterministic IDs stay intact.

### Determinism

Nothing in this branch calls `Math.random()` or reads the wall clock. Run IDs
come from an FNV-1a hash of the canonical run input; timestamps come from a
stepped clock anchored to a fixed demo epoch (2025-03-03T08:00:00Z, 250ms per
event). A run against a fresh store produces byte-identical output every time,
which `tests/coreLoop.test.ts` asserts by comparing serialised state.

### How grouping stays label-free

`room_fit` uses the contract formula. Three terms read current academic work
only: concept gap against the assignment's own concept weights, recent
misconception evidence, and mastery band.

The fourth term, `support_compatibility`, is constant at 1.0 by construction:
every room delivers every documented support, because accessibility is an
overlay on a room rather than a property of one. The term satisfies the formula
while being mathematically incapable of moving a student. `tests/grouping.test.ts`
proves this by re-running placement with all supports granted, all supports
removed, and supports reversed across the cohort; placements are identical in
all three cases. Two Summit students carry documented supports on purpose.

### What was intentionally mocked

- The run store is in-memory on `globalThis`. Person D can swap it for the
  Actian adapter behind the same function surface. Restarting the server loses
  runs, which is fine for a demo but means the frontend should keep its
  `run_id`.
- No model provider is called. Every agent is arithmetic over the seed, which
  is what makes the demo deterministic and offline-safe. Confidence scores are
  derived from real quantities (objective coverage, stored mastery confidence,
  placement decisiveness) rather than sampled.
- Assignment upload accepts a structured `assignment` body but does no file
  parsing or OCR, per the stated non-goals.

### Known risks

- Grouping is tuned against this seed cohort. A very different cohort could
  produce three rooms rather than four; that is allowed by the spec and the
  repair pass is tested, but the demo script assumes four.
- `POST /api/runs` runs all five agents synchronously and returns the finished
  state. It is fast (single-digit milliseconds) but the frontend gets no
  intermediate progress from the response alone; that is what Person D's SSE
  stream on `GET /api/runs/:runId/events` is for.
- Repeated identical POSTs create separate runs with a sequence-suffixed ID
  rather than being idempotent.

### How to demo this branch

```bash
npm install
npm run build && npm start          # or: npm run dev

curl -X POST localhost:3000/api/runs -H 'content-type: application/json' -d '{"demo_mode":true}'
curl localhost:3000/api/runs/<run_id>
curl localhost:3000/api/rooms/ember        # barrier, evidence, members, variant
curl localhost:3000/api/students/stu_09    # Summit student who has a documented support
```

`GET /api/rooms/ember` returns the line the demo script leans on: the room
exists because of one shared academic barrier, with counted evidence, and no
diagnosis or accommodation label was read.
