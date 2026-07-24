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
