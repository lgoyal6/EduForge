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

- Deterministic run creation works.
- All five owned agents return Zod-validated envelopes.
- Room grouping is deterministic and explainable.
- Assignment variants preserve objectives.
- Branch emits events through Person D event bus when integrated.
- Branch has local fallback event collector if Person D branch is not merged yet.
