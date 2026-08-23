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

---

## Completion Notes (Person A)

### What was completed

The whole user-facing slice runs today, with no backend.

**Scaffold.** The repo was docs-only, so this branch also lands the Next.js 15 /
React 19 / TypeScript app shell (`package.json`, `tsconfig.json`,
`next.config.mjs`, `.eslintrc.json`, `vitest.config.ts`, `src/app/layout.tsx`,
`src/app/globals.css`) and `src/contracts/index.ts`. See "Files touched outside
Person A's folders" below.

**Isometric world** (`src/world/**`)

- 2:1 projection with continuous tile coordinates, so actors walk between tiles
  and depth sorting uses one coordinate system (`iso.ts`).
- Buildings are authored by the *screen slot their center should occupy* and
  converted back to tile space (`layout.ts`). Campus layout is therefore edited
  in pixels and still sorts correctly by depth.
- Eleven structures: Professor Tower, Memory Library, Agent Workshop,
  Communication Beacon, Ember / Forge / Harbor / Summit room plots, the central
  Assignment Table, Assessment Forge, Planning Observatory.
- Procedural pixel rendering on a 680x470 base canvas scaled by CSS with
  `image-rendering: pixelated` (`render.ts`). No sprite sheets, so nothing is
  copied from `twofactor/pogicity-demo`; only its projection and depth-sorting
  patterns were used as reference.
- `sim.ts` is a pure reducer: `ingestEvent(state, event)` plus
  `stepWorld(state, dt)`. It has no React and no canvas dependency, which is why
  it is directly unit-testable.

**Event-to-animation coverage.** Every event in `docs/CONTRACTS.md` produces a
visible change, asserted by a test that diffs `render_game_to_text` before and
after each event:

| Event | Animation |
| --- | --- |
| `assignment.uploaded` | Professor walks from the Tower to the AI Guide carrying a scroll. |
| `assignment.concepts.extracted` | Concept diamonds pop above the Assignment Table. |
| `student.context.ready` | Memory Library glows, particles stream to the Agent Workshop, students appear in the commons. |
| `groups.proposed` | Room plots rise to foundation height; students walk to their room. |
| `accessibility.layers.ready` | Support markers attach above each student sprite. |
| `assignment.variants.ready` | Rooms rise to full height and grow a variant scroll. |
| `submissions.received` | Students carry work to the Assessment Forge. |
| `assessment.completed` | Misconception symbols rise from the forge and fade. |
| `student.models.updated` | Students re-walk between rooms; room head-counts change. |
| `lesson.plan.ready` | Translucent tomorrow overlay washes the campus; plan badge over the Observatory. |
| `approval.requested` | Beacon pulses and the professor review panel opens. |

**Panels** (`src/components/panels/**`) - student, room, agent event, lesson
plan item, and per-building detail views; the assignment morph panel with the
Original / Room Version / Student Layer segmented toggle, objective-preservation
badge, and adaptation explanation; and the agent feed with clickable structured
payloads that link back to the students and rooms they mention.

**Controls** (`src/components/demo/**`) - upload (file or paste), teaching
intent, Start run, Run classroom simulation, Skip animation, Reset demo, and a
1x/2x/4x replay speed control.

**Transport** (`src/world/source.ts`, `src/world/api.ts`) - `createMockReplay`
and `createSseSource` satisfy one `RunSource` interface and emit the identical
`AgentEvent` shape. The app probes `/api/runs` once at startup, uses the live
API and SSE when it answers, and silently falls back to mock replay when it does
not. `src/world/runState.ts` projects the event stream into panel state, so mock
and live produce the same UI by construction.

**Automation hooks** - `window.render_game_to_text()` returns a deterministic
text description of the whole world, and `window.advanceTime(ms)` steps the
fixed-timestep clock without waiting on `requestAnimationFrame`. Both are
verified in a real browser by `npm run verify:world`.

### What was intentionally mocked

- `src/world/mock/**` - the frozen demo fixture (1 assignment, 4 concepts, 12
  students, 4 rooms, 4 variants, 12 assessments, 3 regrouping moves, a 5-item
  lesson plan, and 1 low-confidence review item). This is Person A's replay
  data, deliberately separate from Person B's `src/seed`.
- Payload *shapes* for each event are the frontend's best guess at what the
  backend will emit. `src/world/payloads.ts` documents the canonical key for
  every event and reads two or three near-miss shapes per key, returning empty
  results rather than throwing.
- `POST /api/runs/:runId/approve-plan` is called when live, but the approval is
  also recorded locally so the demo continues if the route is missing.

### Known risks

1. **Payload key drift.** If the backend nests results differently (for example
   `{ data: { rooms } }`), the readers return empty and the world will animate a
   phase with no content. The fix is one line per key in `payloads.ts`; the
   readers are the single integration seam.
2. **SSE framing.** `createSseSource` handles both unnamed `message` frames and
   frames named by `event_type`. A backend that sends a different envelope (for
   example wrapping events in `{ event: ... }`) needs `isAgentEvent` to be given
   the inner object.
3. **Backend probe uses `OPTIONS /api/runs`.** A backend that answers `OPTIONS`
   with 404 while implementing `POST` would be misdetected as absent. The app
   still works - it replays mock - but it would not use the real API. One
   console 404 at startup is expected and is exactly this probe.
4. **Live pacing.** Events are gated to one every 0.45s so animations stay
   legible. If the backend emits all eleven events in under a second, the world
   trails the feed by a few seconds. `Skip animation` drains the queue.
5. **Twelve students is the tuned crowd size.** Standing spots are laid out for
   roughly 3-6 per room and 12 at the forge; a much larger class would need the
   `standingSpot` row/column constants widened.
6. **No `prefers-reduced-motion` handling yet.** The canvas animates
   continuously.

### How to demo this branch

```bash
npm install
npm run dev          # http://localhost:3000
```

1. Click **Start run**. Concepts pop over the table, the Memory Library streams
   particles, four room plots rise, then finish with variant scrolls.
2. Click **Ember** in the world. Read the dominant barrier and its evidence refs.
3. In the assignment morph panel, step Original → Room Version → Student Layer.
4. Click **Run classroom simulation**. Students carry work to the forge,
   misconceptions rise, three students move rooms, room counts change, the
   tomorrow overlay appears, and the review panel opens on the low-confidence
   grade.
5. Click any event in the feed to read the exact JSON that crossed the bus.

To check it the way CI does:

```bash
npm run lint && npm run typecheck && npm run test -- --run && npm run build
npm start &
VERIFY_URL=http://localhost:3000 npm run verify:world
```

### Files touched outside Person A's folders

The scaffold did not exist, so this branch created it. Nothing here overwrites
another owner's work; all of it is new:

- `package.json`, `tsconfig.json`, `next.config.mjs`, `.eslintrc.json`,
  `.gitignore`, `vitest.config.ts`
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/icon.svg`
- `src/contracts/index.ts` - transcribed from `docs/CONTRACTS.md` verbatim, with
  the referenced-but-unspecified types (`SupportId`, `MisconceptionId`,
  `RoomId`, `Assignment`, `ConceptSummary`, `AssignmentVariant`,
  `AssessmentResult`, `LessonPlan`, `ReviewItem`) filled in. Person B/C/D should
  treat this as the frozen contract module and raise changes with the team.
- `scripts/verify-world.mjs` - the browser check described above.
- `README.md` - added a "Running the app" section.

---

## Design Pass: Minecraft Interface Language

The first build wrapped a pixel-art world in a generic dark dashboard, so the
chrome and the canvas read as two different products. This pass rebuilds the UI
in the same vocabulary as the world.

### References

`refero_search_styles` and `mobbin.search_screens` were both searched for
Minecraft UI. Neither library carries it - Minecraft's interface is not a
product-design pattern, so it is absent from screen libraries. What they did
return was useful for the adjacent problem of game UI inside a product:

- [Mercury - in-app arcade game screen](https://mobbin.com/screens/9105331f-214a-4734-a40c-7fac714ae096),
  the closest match: pixel type and bordered option cards sitting inside an
  otherwise conventional product shell.
- [Relevance AI - isometric pixel room](https://mobbin.com/screens/c200f5d9-67c3-4302-94ee-86d592b7df24),
  confirming an isometric pixel scene can anchor a working tool.
- Refero: [FRANKY'S](https://frankys-hats.com) for 8-bit commerce chrome and
  [Playdate](https://play.date) for blocky, flat, hard-edged surfaces.

The interface language itself is taken from Minecraft's actual GUI conventions
rather than from a library screenshot.

### The system

**Color.** Neutrals carry a blue-violet bias so the chrome belongs to the night
world on the canvas instead of sitting on it as neutral grey:
`--void #0b0d14`, `--stone #26262f`, `--stone-hi #4d4d5e`, `--slot #15151c`.
One accent, `--gold #ffc64d`, drawn from Minecraft's gold text color; it had to
be a hue the four room colors do not already occupy. Semantic color is separate:
`--xp #7be04a`, `--warn #ffc64d`, `--danger #ff6b5b`.

**Type.** Two pixel faces, inlined as data URIs in `src/app/fonts.css` (both SIL
OFL, latin subset, ~21 KB total): **Press Start 2P** for headings and buttons,
**Silkscreen** for labels, counts and chips. Body prose stays in a system sans.
That last part is the deliberate deviation - Minecraft uses one font for
everything, but this UI carries agent rationale and misconception narratives,
and readability wins over purity where the content is long. The fonts are
embedded rather than linked so a blocked CDN cannot silently fall back to a
non-pixel face mid-demo.

**Surfaces.** Every raised plate has a light top/left and dark bottom/right
bevel; wells invert it. Nothing has a border radius. Buttons sink their bevel on
`:active` rather than fading opacity.

### What changed functionally

- **The phase timeline became a hotbar.** Eleven inventory slots, one per
  contract event, each with a tooltip naming what that stage does. Discrete
  cells make progress countable at a glance, and keys `1`–`9` jump to a stage.
- **Advancement toasts.** Events that fire while you are watching the world were
  previously only recorded in the feed, off to the side - the thing the demo most
  wants you to notice was the thing you were most likely to miss. Capped at two,
  anchored bottom-right (not Minecraft's top-right, because the command rail
  lives there and covering the controls is worse than being off-canon).
- **Segmented meters.** Mastery reads as twenty XP notches instead of a smooth
  fill, so two students differing by one step are distinguishable.
- **Keyboard control.** `Enter` runs the next step, `R` resets, `Esc` clears the
  selection, `1`–`9` select a stage. Ignored while typing in the editor.
- **The primary action is never ambiguous.** Whichever of Start run / Run
  classroom is available pulses gold; the other is visibly dead.
- **Accessibility.** Real `:focus-visible` rings, `prefers-reduced-motion`
  support, `role="meter"` on mastery bars, and descriptive `aria-label`s on
  hotbar slots - none of which existed before.
- `summarizeEvent` was extracted to `src/world/eventSummary.ts` so the feed and
  the toasts cannot describe the same event two different ways.

### Bugs this pass found and fixed

1. A tooltip on a *disabled* button stayed open after the button was clicked and
   then disabled, floating over the layout with no way to dismiss it. Tips are
   now suppressed on `:disabled` / `aria-disabled`.
2. Toasts were covering the command rail. Moved to bottom-right.
3. Toast copy was reusing the hotbar's short labels ("Tomorrow", "Review")
   instead of sentences. Now uses the shared event summary.
4. **Mobile horizontal overflow (390 → 493px).** The cause was not layout:
   `[data-tip]::after` boxes existed at `opacity: 0` with `white-space: nowrap`,
   and an invisible element still contributes to the document's scroll area.
   `getBoundingClientRect` on every element reported no offender, which is what
   pointed at pseudo-elements. Tips are now generated only on `:hover`.
