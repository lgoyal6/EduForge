/**
 * Live Band adapter: real agent communication mesh over band.ai.
 *
 * The local event bus stays the synchronous source of truth (so the SSE route,
 * the UI, and every existing test keep working). On top of that, this adapter:
 *   - creates one real Band room per run (lazily, deduped),
 *   - mirrors every emitted event into that room via Band's REST API,
 *   - opens Band's WebSocket to ingest events posted by other participants and
 *     re-emits them locally (deduped against our own echoes).
 *
 * Every Band call is best-effort: a failure warns once and the local bus keeps
 * the demo running, matching the mock's "never break the demo" contract.
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
import {
  BandRestClient,
  BandRoomSubscription,
  decodeEventContent,
  encodeEventContent,
  type BandClientConfig,
} from "./bandClient";
import type { AdapterInfo, BandAdapter } from "./types";

type LiveSub = { count: number; sub: BandRoomSubscription | null };

export function createLiveBandAdapter(config: BandClientConfig): BandAdapter {
  const rest = new BandRestClient(config);
  const topics = new Set<string>();
  const roomByRun = new Map<string, string>();
  const roomInFlight = new Map<string, Promise<string>>();
  const postTail = new Map<string, Promise<void>>();
  const liveSubs = new Map<string, LiveSub>();
  // event_ids we've already accounted for locally — prevents Band's echo of our
  // own posts from being re-published a second time on the inbound WS stream.
  const seen = new Set<string>();
  const warned = new Set<string>();

  function warnOnce(key: string, error: unknown): void {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[band] ${key} failed; continuing on the local bus. Cause:`, error);
  }

  // Log the connected identity once so demos can show "Connected to Band as X".
  rest
    .getIdentity()
    .then((me) => console.info(`[band] live mode: connected as ${me.name ?? me.handle ?? me.id}`))
    .catch((error) => warnOnce("identity", error));

  function ensureRoom(runId: string): Promise<string> {
    const existing = roomByRun.get(runId);
    if (existing) return Promise.resolve(existing);
    const inFlight = roomInFlight.get(runId);
    if (inFlight) return inFlight;
    const created = rest
      .createChat(`EduForge · run ${runId}`)
      .then((roomId) => {
        roomByRun.set(runId, roomId);
        return roomId;
      })
      .finally(() => roomInFlight.delete(runId));
    roomInFlight.set(runId, created);
    return created;
  }

  /** Post one event to its run's Band room, serialized per run to preserve order. */
  function mirror(event: AgentEvent): void {
    seen.add(event.event_id);
    const tail = (postTail.get(event.run_id) ?? Promise.resolve())
      .then(async () => {
        const roomId = await ensureRoom(event.run_id);
        await rest.postEvent(roomId, encodeEventContent(event));
      })
      .catch((error) => warnOnce("publish", error));
    postTail.set(event.run_id, tail);
  }

  /** Open (or reuse) a live WS subscription to the run's room. */
  function acquireLiveSub(runId: string): void {
    const current = liveSubs.get(runId);
    if (current) {
      current.count += 1;
      return;
    }
    const entry: LiveSub = { count: 1, sub: null };
    liveSubs.set(runId, entry);
    void ensureRoom(runId)
      .then((roomId) =>
        BandRoomSubscription.open(config, roomId, (message) => {
          const event = decodeEventContent(message.content);
          // Re-emit only genuinely new EduForge events (from another instance or
          // agent) — never our own echoed posts.
          if (event && !seen.has(event.event_id)) {
            seen.add(event.event_id);
            publishEvent(event);
          }
        }),
      )
      .then((sub) => {
        const live = liveSubs.get(runId);
        if (!live || live.count === 0) {
          sub?.close();
          return;
        }
        live.sub = sub;
      })
      .catch((error) => warnOnce("subscribe", error));
  }

  function releaseLiveSub(runId: string): void {
    const entry = liveSubs.get(runId);
    if (!entry) return;
    entry.count -= 1;
    if (entry.count <= 0) {
      entry.sub?.close();
      liveSubs.delete(runId);
    }
  }

  return {
    info(): AdapterInfo {
      return { name: "band", mode: "live", provider: "band.ai" };
    },

    publish(event: AgentEvent): void {
      topics.add(event.run_id);
      publishEvent(event);
      mirror(event);
    },

    emit(input: EventInput): AgentEvent {
      topics.add(input.run_id);
      const event = emitEvent(input);
      mirror(event);
      return event;
    },

    subscribe(runId: string, onEvent: EventListener): () => void {
      topics.add(runId);
      const unsubscribe = subscribeToRun(runId, onEvent);
      acquireLiveSub(runId);
      return () => {
        unsubscribe();
        releaseLiveSub(runId);
      };
    },

    history(runId: string): AgentEvent[] {
      return getRunEvents(runId);
    },

    topicSubscriberCount(runId: string): number {
      return getSubscriberCount(runId);
    },

    listTopics(): string[] {
      return [...topics];
    },
  };
}
