import { describe, expect, it } from "vitest";
import type { AgentEvent } from "@/contracts";
import { encodeEventContent } from "./bandClient";

const event: AgentEvent = {
  event_id: "evt_0001",
  event_type: "assignment.concepts.extracted",
  run_id: "run_band",
  source_agent: "assignment_architect",
  timestamp: "2026-07-24T00:00:00.000Z",
  payload: { concepts: ["integer_operations"], count: 1 },
};

describe("encodeEventContent", () => {
  it("renders a readable agent → event line with a compact payload preview", () => {
    const content = encodeEventContent(event);
    expect(content).toContain("assignment_architect → assignment.concepts.extracted");
    expect(content).toContain("concepts: [1]"); // arrays shown as [length]
    expect(content).toContain("count: 1");
  });

  it("omits the preview when there is no payload", () => {
    const content = encodeEventContent({ ...event, payload: {} });
    expect(content).toBe("assignment_architect → assignment.concepts.extracted");
  });
});
