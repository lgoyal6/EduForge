import { describe, expect, it } from "vitest";
import type { AgentEvent } from "@/contracts";
import { decodeEventContent, encodeEventContent } from "./bandClient";

const event: AgentEvent = {
  event_id: "evt_0001",
  event_type: "assignment.concepts.extracted",
  run_id: "run_band",
  source_agent: "assignment_architect",
  timestamp: "2026-07-24T00:00:00.000Z",
  payload: { concepts: ["integer_operations"], count: 1 },
};

describe("band wire format", () => {
  it("round-trips an event through message content", () => {
    const content = encodeEventContent(event);
    // Human-readable summary leads the content for the Band room UI.
    expect(content.startsWith("assignment_architect → assignment.concepts.extracted")).toBe(true);
    expect(decodeEventContent(content)).toEqual(event);
  });

  it("returns null for external (non-EduForge) messages", () => {
    expect(decodeEventContent("Looks good — approved!")).toBeNull();
  });

  it("returns null for a marked-but-corrupt envelope instead of throwing", () => {
    expect(decodeEventContent("summary\n\n⟦eduforge-event⟧{not json")).toBeNull();
  });
});
