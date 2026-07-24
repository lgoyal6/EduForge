/**
 * Fallback run store — Person C owned.
 *
 * INTEGRATION POINT: Person B owns the real run store (`src/server/runStore.ts`)
 * and `POST /api/runs`. When that branch merges, swap `getOrCreateRun` /
 * `getRun` / `saveRun` to delegate there and delete the seed bootstrap. The
 * agents and routes only use this module's function signatures.
 *
 * Cached on globalThis so Next.js dev reloads keep run state.
 */
import type { AgentEvent, AgentName, EventType, RunState } from "@/contracts";
import { emitEvent, resetEventBus } from "@/server/events";
import { buildSeedRun } from "./seedRun";

type RunStoreState = {
  runs: Map<string, RunState>;
};

const GLOBAL_KEY = "__eduforge_run_store_fallback__";

function getState(): RunStoreState {
  const store = globalThis as Record<string, unknown>;
  if (!store[GLOBAL_KEY]) {
    store[GLOBAL_KEY] = { runs: new Map() } satisfies RunStoreState;
  }
  return store[GLOBAL_KEY] as RunStoreState;
}

/** Publish through Person D's event bus and mirror onto the run's event log. */
export function emitRunEvent(
  run: RunState,
  event_type: EventType,
  source_agent: AgentName,
  payload: Record<string, unknown>,
): AgentEvent {
  const event = emitEvent({ event_type, run_id: run.run_id, source_agent, payload });
  run.events.push(event);
  return event;
}

/**
 * Replay the upstream (Person B) half of the loop for a bootstrapped run so
 * the event history is complete and in the CONTRACTS.md order.
 */
function emitUpstreamEvents(run: RunState): void {
  emitRunEvent(run, "assignment.uploaded", "assignment_architect", {
    assignment_id: run.assignment.assignment_id,
    title: run.assignment.title,
    question_count: run.assignment.questions.length,
    demo_mode: true,
  });
  emitRunEvent(run, "assignment.concepts.extracted", "assignment_architect", {
    concept_ids: run.concepts.map((concept) => concept.concept_id),
  });
  emitRunEvent(run, "student.context.ready", "student_memory_agent", {
    student_count: run.students.length,
  });
  emitRunEvent(run, "groups.proposed", "grouping_agent", {
    room_ids: run.rooms.map((room) => room.room_id),
    room_sizes: Object.fromEntries(run.rooms.map((room) => [room.room_id, room.members.length])),
  });
  emitRunEvent(run, "accessibility.layers.ready", "accessibility_agent", {
    students_with_supports: run.students.filter((student) => student.supports.length > 0).length,
  });
  emitRunEvent(run, "assignment.variants.ready", "assignment_curator", {
    variant_ids: run.variants.map((variant) => variant.variant_id),
    objective_preserved: run.variants.every((variant) => variant.objective_preserved),
  });
}

export function getRun(runId: string): RunState | undefined {
  return getState().runs.get(runId);
}

/** Fetch a run, bootstrapping the deterministic seed run if it is unknown. */
export function getOrCreateRun(runId: string): RunState {
  const state = getState();
  const existing = state.runs.get(runId);
  if (existing) return existing;

  const run = buildSeedRun(runId);
  emitUpstreamEvents(run);
  state.runs.set(runId, run);
  return run;
}

export function saveRun(run: RunState): void {
  getState().runs.set(run.run_id, run);
}

/** Drop a run and its event history so the next access re-seeds cleanly. */
export function resetRun(runId: string): void {
  getState().runs.delete(runId);
  resetEventBus(runId);
}
