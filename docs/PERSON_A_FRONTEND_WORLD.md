# Person A: Frontend World and Design

Branch: `person-a/frontend-world`

## Mission

Make EduForge unforgettable. Judges should understand the backend architecture by watching the school move.

This branch owns the whole user-facing experience:

- Isometric pixel school.
- React control panels.
- Demo choreography.
- Event-to-animation bridge.
- Upload and simulation buttons.
- Student, room, assignment, agent payload detail views.

## Reference Repo

Primary reference: https://github.com/twofactor/pogicity-demo

Use its Phaser/Next.js isometric patterns:

- 2:1 isometric projection.
- Building placement.
- Depth sorting.
- Character movement.
- Local world state.

Do not ship its proprietary character sprites. Replace with simple custom sprites or generated placeholders.

## Owned Folders

- `src/world/**`
- `src/components/world/**`
- `src/components/panels/**`
- `src/components/demo/**`
- `src/app/page.tsx`
- `public/assets/**`

## UI Surfaces

1. Main world canvas
   - Professor Tower.
   - Memory Library.
   - Agent Workshop.
   - Communication Beacon.
   - Room plots for Ember, Forge, Harbor, Summit.
   - Assessment Forge.
   - Planning Observatory.

2. Top command rail
   - Upload assignment.
   - Teaching intent input.
   - Start run.
   - Run classroom simulation.
   - Reset demo.

3. Right detail panel
   - Selected student.
   - Selected room.
   - Selected agent event.
   - Selected lesson plan item.

4. Assignment morph panel
   - Segmented toggle: Original, Room Version, Student Layer.
   - Objective preservation badge.
   - Adaptation explanation.

5. Agent feed
   - Compact event stream.
   - Click event to reveal structured payload.

## Required Animations

| Event | Animation |
| --- | --- |
| `assignment.uploaded` | Professor avatar passes scroll to AI guide. |
| `assignment.concepts.extracted` | Concept icons pop above central table. |
| `student.context.ready` | Memory Library pulses, particles travel to Agent Workshop. |
| `groups.proposed` | Room foundations appear on plots. |
| `accessibility.layers.ready` | Small support markers attach to student cards. |
| `assignment.variants.ready` | Rooms rise to full height, scrolls appear. |
| `submissions.received` | Students walk to Assessment Forge. |
| `assessment.completed` | Misconception symbols rise from forge. |
| `student.models.updated` | Students move between rooms; before/after room counts update. |
| `lesson.plan.ready` | Tomorrow-world translucent overlay appears. |

## Local Mock Mode

Person A must not wait for backend branches.

Implement `mockEventReplay` that replays the frozen event sequence using local JSON. It should use the same `AgentEvent` shape as the real SSE stream.

## Frontend API Usage

- `POST /api/runs`: start run.
- `GET /api/runs/:runId`: load state.
- `GET /api/runs/:runId/events`: subscribe to SSE.
- `POST /api/runs/:runId/simulate-submissions`: trigger assessment phase.

## Done Checklist

- App runs with mock event replay.
- App runs against real API routes once available.
- All required events produce visible state change.
- Users can click room, student, and agent event.
- Assignment morph toggle works.
- No layout overlap at desktop and mobile widths.
- Canvas exposes `window.render_game_to_text`.
- Canvas exposes `window.advanceTime(ms)` if Phaser loop can support it.
- Playwright screenshot confirms world is nonblank and interactions work.
