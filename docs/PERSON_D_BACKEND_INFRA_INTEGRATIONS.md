# Person D: Backend Infra and Sponsor Integrations

Branch: `person-d/backend-infra-integrations`

## Mission

Make the app feel like a real self-evolving agent system while keeping demo reliability.

This branch owns:

- Event bus.
- SSE route.
- Agent audit log.
- Sponsor-style adapter interfaces.
- Mock implementations.
- Environment configuration.
- CI.

## Owned Folders

- `src/server/events/**`
- `src/server/adapters/**`
- `src/server/audit/**`
- `src/server/config/**`
- `src/app/api/runs/[runId]/events/**`
- `.env.example`
- `.github/workflows/**`

## Event Bus

Required API:

```ts
publishEvent(event: AgentEvent): void;
subscribeToRun(runId: string, onEvent: (event: AgentEvent) => void): () => void;
getRunEvents(runId: string): AgentEvent[];
```

SSE route:

```txt
GET /api/runs/:runId/events
```

SSE format:

```txt
event: agent-event
data: {"event_id":"evt_001",...}
```

## Sponsor Adapter Interfaces

### Guild Adapter

Purpose:

- Agent registry.
- Permissions.
- Workflow run IDs.
- Human approval gates.
- Audit trail.

Mock behavior:

- Register all eight agents.
- Store each agent run.
- Mark low-confidence grade and final plan as review gates.

### Band Adapter

Purpose:

- Agent communication mesh.
- Event topics.
- Requests/responses.

Mock behavior:

- Wrap local event bus.
- Track topic subscribers.
- Provide event history for UI.

### Actian Adapter

Purpose:

- Structured classroom records.
- Vector learning observations.

Mock behavior:

- In-memory or JSON-backed store.
- `findRelevantStudentContext(concepts)`.
- `writeLearningObservation(observation)`.
- `getGroupSnapshots(runId)`.

### Model Adapter

Purpose:

- Structured reasoning/generation.
- Concept labels.
- Assignment variant text.
- Misconception explanation.
- Lesson plan synthesis.

Mock behavior:

- Deterministic responses from seed data.
- Optional provider mode behind env vars.

### Replay Adapter

Purpose:

- Demo reliability and debugging.

Mock behavior:

- Client-side init hook.
- Console log marker.
- No-op if key missing.

## Env Vars

```txt
SPONSOR_MODE=mock
MODEL_PROVIDER=mock
MODEL_API_KEY=
ACTIAN_URL=
ACTIAN_API_KEY=
GUILD_API_KEY=
BAND_API_KEY=
REPLAY_API_KEY=
```

## CI

GitHub Actions should run:

```bash
npm ci
npm run lint
npm run typecheck
npm run test -- --run
npm run build
```

## Done Checklist

- SSE stream works with multiple subscribers.
- Event history is retrievable.
- Mock adapters require no external keys.
- Missing external API keys do not break demo.
- Audit log records agent, action, evidence refs, and review gates.
- CI exists and uses the same commands expected before merge.

## Completion Notes (2026-07-24)

### What was completed

- Next.js 16 scaffold (no scaffold existed on `main`; this branch merges first, so it carries `package.json`, tsconfig, ESLint flat config, Vitest, and a placeholder `src/app` shell for Person A to replace).
- `src/contracts/index.ts`: frozen contracts from `docs/CONTRACTS.md`, with the referenced-but-undefined types (`Assignment`, `ConceptSummary`, `AssignmentVariant`, `AssessmentResult`, `LessonPlan`, `ReviewItem`, `SupportId`, `MisconceptionId`, `RoomId`) filled in minimally plus a Zod schema for `AgentEvent`.
- `src/server/events`: in-memory bus with `publishEvent` / `subscribeToRun` / `getRunEvents` (exact contract API) plus `createEvent` / `emitEvent` helpers B and C should use. State survives dev-server module reloads via a `globalThis` cache.
- `GET /api/runs/:runId/events`: SSE (`event: agent-event`) with full history replay before live streaming, 15s keepalive comments, and unsubscribe on client abort. `?format=json` (or `Accept: application/json`) returns plain event history.
- `POST /api/runs/:runId/events`: mock-mode-only event injector so Person A can drive world animations before the agent loop merges. Returns 403 when `SPONSOR_MODE=live`.
- `src/server/audit`: audit log recording actor (agent/system/professor), action, evidence refs, review-gate flag.
- `src/server/adapters`: Guild, Band, Actian, Model, Replay interfaces + mock implementations; `getAdapters()` factory singleton; `getAdapterStatus()` for debugging.
- `src/server/config`: `SPONSOR_MODE=mock` default; `resolveAdapterMode` returns live only when mode is live AND keys are present, otherwise mock with a one-time warning.
- CI at `.github/workflows/ci.yml`: `npm ci`, lint, typecheck, `test -- --run`, build on Node 24.
- 33 Vitest tests across bus, config, audit, adapters, and the SSE route.

### What was intentionally mocked

- All five sponsor adapters. No live implementations exist; in live mode every adapter falls back to mock (with a warning) even when keys are present. Swapping in a real adapter is one line in `src/server/adapters/index.ts#buildAdapters`.
- Model adapter returns deterministic fixtures per task; B/C can override per-task output with `model.setMockResponse(task, output)` using seed-derived data.

### Known risks

- Event bus and stores are in-memory and per-process: fine for one local dev/prod server, not for serverless multi-instance deploys. For Vercel-style deploys the SSE route and run loop must share one process, or the bus needs a real backend.
- Contracts referenced-but-undefined types were defined by Person D; B and C should review before treating them as frozen.

### How to demo this branch

```bash
npm run dev
# terminal 1: stream
curl -N http://localhost:3000/api/runs/run_demo/events
# terminal 2: inject an event (mock mode only)
curl -X POST http://localhost:3000/api/runs/run_demo/events \
  -H 'Content-Type: application/json' \
  -d '{"event_type":"assignment.uploaded","source_agent":"assignment_architect","payload":{}}'
```

### Interfaces for B and C

```ts
import { emitEvent } from "@/server/events";          // publish agent events
import { recordAudit } from "@/server/audit";          // audit trail + review gates
import { getAdapters } from "@/server/adapters";       // { guild, band, actian, model, replay }
```
