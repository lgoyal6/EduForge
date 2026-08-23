# Person C: Backend Assessment and Evolution

Branch: `person-c/backend-assessment-evolution`

## Mission

Build the second half of the loop: submissions change the classroom.

This branch handles:

- Prepared submissions.
- Deterministic grading.
- Misconception classification.
- Confidence and review queue.
- Mastery updates.
- Room evolution.
- Next-day teaching plan.

## Reference Repo

Primary reference: https://github.com/RudrenduPaul/MasteryTrace

Use it directly if integration is fast. If not, implement a small local BKT wrapper with the same event shape and swap later.

## Owned Folders

- `src/seed/submissions.ts`
- `src/server/submissions/**`
- `src/server/mastery/**`
- `src/server/agents/assessment.ts`
- `src/server/agents/classroomEvolution.ts`
- `src/server/agents/lessonPlanner.ts`
- `src/app/api/runs/[runId]/simulate-submissions/**`
- `src/app/api/runs/[runId]/approve-plan/**`

## Agents

### Assessment Agent

Consumes:

- `submissions.received`

Publishes:

- `assessment.completed`

Output:

- Score per student.
- Question-level correctness.
- Misconception IDs.
- Reasoning trace.
- Confidence.
- Review state.

Rules:

- At least one grade must be low confidence and enter review.
- Do not publish final grades without professor approval.
- Explanations must cite question/student evidence.

### Classroom Evolution Agent

Consumes:

- `assessment.completed`

Publishes:

- `student.models.updated`

Output:

- Updated mastery estimates.
- Updated misconception confidence.
- Updated scaffolding levels.
- New recommended room membership.

Required demo outcome:

- Ember intervention succeeds.
- Four of five Ember students improve.
- Forge becomes largest remaining gap.
- Maya moves from high scaffolding to medium scaffolding.

### Lesson Planner

Consumes:

- `student.models.updated`

Publishes:

- `lesson.plan.ready`

Output:

- Next-day teaching timeline.
- Whole-class intervention.
- Room rotations.
- Evidence links.
- Professor approval state.

Required demo plan:

1. Whole-class distribution mini-lesson.
2. Room rotations.
3. Ember quick check.
4. Forge targeted box-model practice.
5. Harbor sequencing transfer task.
6. Summit extension justification.

## API Routes

### `POST /api/runs/:runId/simulate-submissions`

Behavior:

- Emit `submissions.received`.
- Run Assessment Agent.
- Run Classroom Evolution Agent.
- Run Lesson Planner.

Output:

- Updated `RunState`.

### `POST /api/runs/:runId/approve-plan`

Behavior:

- Stores approval state on lesson plan.
- Adds audit event.

## Mastery Update

Minimum local BKT behavior:

```txt
correct answer:
  mastery_score += 0.08 * confidence

incorrect answer:
  mastery_score -= 0.06 * confidence

after clamp:
  score in [0, 1]
  confidence increases when new evidence aligns with old pattern
```

SOTA version:

- Use response events in MasteryTrace format.
- Score per learner and concept.
- Store deltas with evidence references.

## Done Checklist

- Simulation endpoint works from fixed seed.
- Assessments are deterministic.
- Low-confidence review item appears.
- Mastery deltas are visible in API output.
- Room membership changes after assessment.
- Lesson plan has evidence links.
- Events are emitted in correct order.

## Completion Notes (2026-07-24)

### Completed

- Prepared submissions for all 15 students (`src/seed/submissions.ts`), hand-tuned against the BKT parameters so every required demo outcome holds.
- Assessment Agent (`src/server/agents/assessment.ts`): deterministic key-based grading, misconception classification from error fingerprints in the written work, per-student confidence with reasoning traces citing `submission:{student}:{question}` evidence. Dev Patel (s02) lands at confidence 0.56 → the one `low_confidence_grade` review item; his grade is never auto-published.
- Mastery update (`src/server/mastery/`): local typed BKT wrapper over MasteryTrace-shaped response events (learner, skill, correct, weight, evidence_ref). Weighted posterior updates (low-confidence grades barely move the model), stored deltas with evidence refs, confidence rises when evidence aligns with the prior trend.
- Classroom Evolution Agent (`src/server/agents/classroomEvolution.ts`): mastery updates, scaffolding policy (Maya s01 drops high→medium; Priya s08 too; Mateo s09 rises), room re-recommendation by weakest remaining barrier. Result: Ember 5→2, Forge 4→7 (largest), Harbor 2, Summit 4 (Zoe s10 promoted).
- Lesson Planner (`src/server/agents/lessonPlanner.ts`): six-step timeline in the required order - whole-class distribution mini-lesson (largest remaining gap), room rotations, Ember quick check, Forge box-model practice, Harbor sequencing transfer, Summit extension justification - every step with evidence refs; plan starts `pending` approval.
- `POST /api/runs/:runId/simulate-submissions` and `POST /api/runs/:runId/approve-plan` routes; events emitted in exact CONTRACTS.md order through the event bus; assessment/plan review gates recorded on the audit log.
- 24 vitest tests pin every required demo outcome plus determinism and the approval flow. lint / typecheck / test / build all pass.

### Intentionally mocked / fallback

- **Run store**: Person B owns `src/server/runStore.ts` + `POST /api/runs`. Until that merges, `src/server/submissions/runProvider.ts` bootstraps a deterministic seed run (15 students, 4 rooms, assignment, variants) frozen at `variants_ready` for any unknown runId, and replays the six upstream events so the event history is complete. Swap `getOrCreateRun`/`getRun`/`saveRun` to Person B's store at integration; agents only use these signatures.
- **MasteryTrace**: implemented as a local BKT wrapper with the same response-event shape rather than importing the library; swap later without touching callers.
- **Scaffold + shared infra**: this branch adopted Person D's in-progress scaffold, `src/contracts/index.ts`, `src/server/events/*`, and `src/server/audit/*` verbatim (byte-identical copies) so both branches merge cleanly. If Person D's copies have evolved by merge time, take theirs - this branch only uses the documented `emitEvent`/`getRunEvents`/`resetEventBus`/`recordAudit` API.

### Known risks

- Event ids/timestamps come from the shared bus (wall clock, process-global counter), so they are not deterministic across processes; all domain output (grades, mastery, rooms, plan) is fully deterministic and tested.
- Re-simulating a planned run intentionally resets it to the seed state (fresh demo every click). If Person B's real runs must survive re-simulation, revisit `simulateSubmissions`'s reset branch.
- `approve-plan` approves the plan gate only; the low-confidence grade stays pending by design (no endpoint to resolve it yet - integration decision).

### How to demo this branch

```bash
npm ci && npm run dev
curl -X POST localhost:3000/api/runs/demo-run/simulate-submissions | jq '.rooms[] | {room_id, members}'
curl -X POST localhost:3000/api/runs/demo-run/approve-plan -d '{"approved_by":"Prof. Rivera"}' | jq '.run.lesson_plan.approval_state'
```

Watch for: 11 events in contract order, Ember 5→2 with 4/5 improving integer operations, Forge at 7 members with `distributive_property` the largest gap, Maya at scaffolding 2, s02 pending in the review queue, and the plan opening with the whole-class distribution mini-lesson.
