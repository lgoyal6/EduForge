/**
 * Thin client for the real Band platform (band.ai).
 *
 * Two transports, matching Band's own SDK split:
 *   - REST (fetch): create rooms, post messages, read history, identity.
 *     Auth via the `X-API-Key` header.
 *   - WebSocket (Phoenix Channels v2): subscribe to a room's `message_created`
 *     stream. Loaded lazily so the `phoenix`/`ws` deps are only pulled in when
 *     live subscription is actually used (and never bundled for the client).
 *
 * Endpoints and shapes verified against https://docs.band.ai/openapi.json and
 * the official Python SDK (thenvoi/thenvoi-sdk-python).
 */
import type { AgentEvent } from "@/contracts";
import { agentEventSchema } from "@/contracts";

export type BandClientConfig = {
  restUrl: string; // e.g. https://app.band.ai
  wsUrl: string; // e.g. wss://app.band.ai/api/v1/socket/websocket
  agentId: string;
  apiKey: string;
};

export class BandApiError extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string,
    readonly body: string,
  ) {
    super(`Band API ${status} on ${endpoint}: ${body.slice(0, 200)}`);
    this.name = "BandApiError";
  }
}

/** Band's ChatRoom (subset we use). */
type BandChatRoom = { id: string; title: string | null };

/** Band chat-event types. Events report what happened (no @mention needed). */
export type BandEventType = "tool_call" | "tool_result" | "thought" | "error" | "task" | "attention";

/** Band's ChatMessage (subset we use). */
export type BandChatMessage = {
  id: string;
  chat_room_id?: string | null;
  content: string;
  message_type: string;
  sender_id: string;
  sender_name?: string | null;
  sender_type: string;
  inserted_at?: string | null;
};

// ---------------------------------------------------------------------------
// Wire format: EduForge AgentEvent <-> Band message content
// ---------------------------------------------------------------------------

/**
 * Marker separating the human-readable summary from the machine-readable
 * envelope inside a Band message's `content`. A message without the marker is
 * treated as external (e.g. a professor typing in the room) and is not an
 * EduForge event.
 */
const ENVELOPE_MARKER = "\n\n⟦eduforge-event⟧";

/** Encode an EduForge event as Band message content: a readable line + the envelope. */
export function encodeEventContent(event: AgentEvent): string {
  const summary = `${event.source_agent} → ${event.event_type}`;
  return `${summary}${ENVELOPE_MARKER}${JSON.stringify(event)}`;
}

/**
 * Recover an EduForge event from Band message content, or null when the message
 * did not originate from EduForge (no marker) or fails contract validation.
 */
export function decodeEventContent(content: string): AgentEvent | null {
  const index = content.indexOf(ENVELOPE_MARKER);
  if (index === -1) return null;
  const json = content.slice(index + ENVELOPE_MARKER.length);
  try {
    const parsed = agentEventSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// REST client
// ---------------------------------------------------------------------------

export class BandRestClient {
  constructor(private readonly config: BandClientConfig) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const endpoint = `${this.config.restUrl.replace(/\/$/, "")}${path}`;
    const response = await fetch(endpoint, {
      method,
      headers: {
        "X-API-Key": this.config.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new BandApiError(response.status, path, await response.text().catch(() => ""));
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  /** GET /api/v1/agent/me — confirms the credential and returns the agent profile. */
  async getIdentity(): Promise<{ id: string; name?: string; handle?: string; owner_uuid?: string }> {
    const res = await this.request<{
      data: { id: string; name?: string; handle?: string; owner_uuid?: string };
    }>("GET", "/api/v1/agent/me");
    return res.data;
  }

  /** POST /api/v1/agent/chats/{id}/participants — add a user/agent to the room. */
  async addParticipant(chatId: string, participantId: string, role = "member"): Promise<void> {
    await this.request("POST", `/api/v1/agent/chats/${chatId}/participants`, {
      participant: { participant_id: participantId, role },
    });
  }

  /** POST /api/v1/agent/chats — create a room. Owner is auto-set to this agent. */
  async createChat(title: string): Promise<string> {
    const res = await this.request<{ data: BandChatRoom }>("POST", "/api/v1/agent/chats", {
      chat: { title: title.slice(0, 120) },
    });
    return res.data.id;
  }

  /**
   * POST /api/v1/agent/chats/{id}/events — post an activity event.
   *
   * Events (not messages) are the right primitive here: they "report what
   * happened rather than directing messages at participants", so they need no
   * @mention. A message requires mentioning another participant (self-mention
   * is rejected), which a solo broadcasting agent has no one to do.
   */
  async postEvent(
    chatId: string,
    content: string,
    messageType: BandEventType = "thought",
  ): Promise<{ id: string }> {
    const res = await this.request<{ data: { id: string } }>(
      "POST",
      `/api/v1/agent/chats/${chatId}/events`,
      { event: { content, message_type: messageType } },
    );
    return res.data;
  }

  /** GET /api/v1/agent/chats/{id}/messages — one page of room history. */
  async listMessages(chatId: string): Promise<BandChatMessage[]> {
    const res = await this.request<{ data: BandChatMessage[] }>(
      "GET",
      `/api/v1/agent/chats/${chatId}/messages`,
    );
    return res.data ?? [];
  }
}

// ---------------------------------------------------------------------------
// WebSocket subscription (Phoenix Channels v2)
// ---------------------------------------------------------------------------

export type BandRoomListener = (message: BandChatMessage) => void;

/**
 * Live subscription to one Band room's `message_created` stream. Uses the
 * `phoenix` client over the Node `ws` transport, both imported lazily. Auth
 * travels as the `api_key` query param (accepted alongside the header per
 * Band's SDK). Any failure is non-fatal: the caller keeps working off REST.
 */
export class BandRoomSubscription {
  private socket: { disconnect: () => void } | null = null;

  private constructor() {}

  static async open(
    config: BandClientConfig,
    roomId: string,
    onMessage: BandRoomListener,
  ): Promise<BandRoomSubscription | null> {
    try {
      const [{ Socket }, wsModule] = await Promise.all([
        import("phoenix") as Promise<{ Socket: new (url: string, opts: unknown) => PhoenixSocket }>,
        import("ws") as Promise<{ default: unknown }>,
      ]);
      const sub = new BandRoomSubscription();
      const socket = new Socket(config.wsUrl, {
        transport: wsModule.default,
        params: { api_key: config.apiKey, agent_id: config.agentId },
      });
      socket.onError((err: unknown) =>
        console.warn(`[band] websocket error for room ${roomId}:`, err),
      );
      socket.connect();
      const channel = socket.channel(`chat_room:${roomId}`, {});
      channel.on("message_created", (payload: BandChatMessage) => onMessage(payload));
      channel
        .join()
        .receive("error", (reason: unknown) =>
          console.warn(`[band] failed to join chat_room:${roomId}:`, reason),
        );
      sub.socket = socket;
      return sub;
    } catch (error) {
      console.warn(`[band] live subscription unavailable for room ${roomId}:`, error);
      return null;
    }
  }

  close(): void {
    try {
      this.socket?.disconnect();
    } catch {
      // best-effort teardown
    }
    this.socket = null;
  }
}

/** Minimal shape of the phoenix Socket/Channel we rely on. */
type PhoenixPush = { receive(status: string, cb: (reason: unknown) => void): PhoenixPush };
type PhoenixChannel = {
  on(event: string, cb: (payload: BandChatMessage) => void): void;
  join(): PhoenixPush;
};
type PhoenixSocket = {
  connect(): void;
  disconnect(): void;
  onError(cb: (err: unknown) => void): void;
  channel(topic: string, params: unknown): PhoenixChannel;
};
