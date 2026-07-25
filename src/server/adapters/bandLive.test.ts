import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEventBus } from "@/server/events";
import { createLiveBandAdapter } from "./bandLive";
import { decodeEventContent } from "./bandClient";

const CONFIG = {
  restUrl: "https://app.band.ai",
  wsUrl: "wss://app.band.ai/api/v1/socket/websocket",
  agentId: "agent-uuid",
  apiKey: "band-key",
};

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

function installFetchMock(): { calls: Call[]; fail?: () => void } {
  const calls: Call[] = [];
  const impl = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({
      url,
      method: init.method ?? "GET",
      headers: (init.headers as Record<string, string>) ?? {},
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    if (url.endsWith("/api/v1/agent/me")) {
      return Response.json({ data: { id: "agent-uuid", name: "EduForge Bot" } });
    }
    if (url.endsWith("/api/v1/agent/chats")) {
      return Response.json({ data: { id: "room-123", title: null } }, { status: 201 });
    }
    if (url.endsWith("/events")) {
      return Response.json({ data: { id: "evt-1", success: true, message_type: "thought" } }, { status: 201 });
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", impl);
  return { calls };
}

beforeEach(() => {
  resetEventBus();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("live band adapter (fetch-mocked)", () => {
  it("creates a room and posts the encoded event with the API key header", async () => {
    const { calls } = installFetchMock();
    const band = createLiveBandAdapter(CONFIG);

    const event = band.emit({
      run_id: "run_live",
      event_type: "assignment.uploaded",
      source_agent: "assignment_architect",
    });

    // emit is synchronous: the envelope is returned and on the local bus immediately.
    expect(event.event_id).toMatch(/^evt_/);
    expect(band.history("run_live")).toHaveLength(1);

    // the Band round-trip happens asynchronously in the background.
    await vi.waitFor(() => {
      const post = calls.find((c) => c.url.endsWith("/events"));
      expect(post).toBeDefined();
    });

    const createRoom = calls.find((c) => c.method === "POST" && c.url.endsWith("/api/v1/agent/chats"));
    expect(createRoom?.body).toEqual({ chat: { title: "EduForge · run run_live" } });

    const post = calls.find((c) => c.url.endsWith("/events"))!;
    expect(post.url).toBe("https://app.band.ai/api/v1/agent/chats/room-123/events");
    expect(post.headers["X-API-Key"]).toBe("band-key");
    const body = post.body as { event: { content: string; message_type: string } };
    expect(body.event.message_type).toBe("thought");
    expect(decodeEventContent(body.event.content)).toEqual(event);
  });

  it("reuses a single room across events in the same run", async () => {
    const { calls } = installFetchMock();
    const band = createLiveBandAdapter(CONFIG);

    band.emit({ run_id: "run_x", event_type: "assignment.uploaded", source_agent: "assignment_architect" });
    band.emit({ run_id: "run_x", event_type: "groups.proposed", source_agent: "grouping_agent" });

    await vi.waitFor(() => {
      expect(calls.filter((c) => c.url.endsWith("/events"))).toHaveLength(2);
    });
    expect(calls.filter((c) => c.method === "POST" && c.url.endsWith("/api/v1/agent/chats"))).toHaveLength(1);
  });

  it("keeps the local bus working when Band is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const band = createLiveBandAdapter(CONFIG);

    const event = band.emit({
      run_id: "run_down",
      event_type: "lesson.plan.ready",
      source_agent: "lesson_planner",
    });

    expect(event).toBeDefined();
    expect(band.history("run_down")).toHaveLength(1);
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
