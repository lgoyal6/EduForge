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
