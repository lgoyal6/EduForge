/**
 * Mock Band adapter: agent communication mesh wrapping the local event bus.
 * Tracks run topics and subscriber counts, exposes history for UI replay.
 */
import type { AgentEvent } from "@/contracts";
import {
  emitEvent,
  getRunEvents,
  getSubscriberCount,
  publishEvent,
  subscribeToRun,
  type EventInput,
  type EventListener,
} from "@/server/events";
import type { AdapterInfo, BandAdapter } from "./types";

type BandState = {
  topics: Set<string>;
};

const GLOBAL_KEY = "__eduforge_band_mock__";

function getState(): BandState {
  const store = globalThis as Record<string, unknown>;
  if (!store[GLOBAL_KEY]) {
    store[GLOBAL_KEY] = { topics: new Set<string>() } satisfies BandState;
  }
  return store[GLOBAL_KEY] as BandState;
}

export function createMockBandAdapter(): BandAdapter {
  return {
    info(): AdapterInfo {
      return { name: "band", mode: "mock", provider: "local-event-bus" };
    },

    publish(event: AgentEvent): void {
      getState().topics.add(event.run_id);
      publishEvent(event);
    },

    emit(input: EventInput): AgentEvent {
      getState().topics.add(input.run_id);
      return emitEvent(input);
    },

    subscribe(runId: string, onEvent: EventListener): () => void {
      getState().topics.add(runId);
      return subscribeToRun(runId, onEvent);
    },

    history(runId: string): AgentEvent[] {
      return getRunEvents(runId);
    },

    topicSubscriberCount(runId: string): number {
      return getSubscriberCount(runId);
    },

    listTopics(): string[] {
      return [...getState().topics];
    },
  };
}

/** Test/demo-reset helper. */
export function resetMockBand(): void {
  const store = globalThis as Record<string, unknown>;
  delete store[GLOBAL_KEY];
}
