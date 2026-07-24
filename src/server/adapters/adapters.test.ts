import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Room } from "@/contracts";
import { getReviewGates, resetAuditLog } from "@/server/audit";
import { resetEventBus } from "@/server/events";
import { getAdapterStatus, getAdapters, resetAdapters } from "./index";

const RUN = "run_adapters";

const emberRoom: Room = {
  room_id: "ember",
  name: "Ember",
  focus_concepts: ["integer_operations"],
  dominant_barrier: "repeated sign errors in integer operations",
  evidence_refs: ["obs_0001"],
  members: ["s1", "s2"],
  base_adaptation: "worked examples first",
  explanation: "Grouped by shared sign-error barrier.",
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("SPONSOR_MODE", "");
  resetAdapters();
  resetEventBus();
  resetAuditLog();
});

describe("guild adapter (mock)", () => {
  it("registers all eight contract agents idempotently", () => {
    const { guild } = getAdapters();
    const first = guild.registerDefaultAgents();
    const second = guild.registerDefaultAgents();

    expect(first).toHaveLength(8);
    expect(guild.listAgents()).toHaveLength(8);
    expect(second[0].registered_at).toBe(first[0].registered_at);
  });

  it("stores agent runs and opens review gates for low-confidence work", () => {
    const { guild } = getAdapters();
    guild.recordAgentRun({
      run_id: RUN,
      agent: "assessment_agent",
      status: "needs_review",
      confidence: 0.5,
      evidence_refs: ["submission:s3:q2"],
      human_review_required: true,
    });
    guild.recordAgentRun({
      run_id: RUN,
      agent: "lesson_planner",
      status: "completed",
      confidence: 0.9,
      evidence_refs: ["plan:day2"],
      human_review_required: true,
    });

    expect(guild.getAgentRuns(RUN)).toHaveLength(2);
    const gates = guild.listApprovals(RUN);
    expect(gates.map((gate) => gate.gate_type)).toEqual(["low_confidence_grade", "final_plan"]);
    expect(getReviewGates(RUN).length).toBeGreaterThanOrEqual(2);
  });

  it("resolves approval gates and audits the professor decision", () => {
    const { guild } = getAdapters();
    const gate = guild.requestApproval({
      run_id: RUN,
      gate_type: "final_plan",
      subject_id: "lesson_plan",
      reason: "Final plan requires professor sign-off.",
    });

    const resolved = guild.resolveApproval(gate.gate_id, "approved");
    expect(resolved?.status).toBe("approved");
    expect(resolved?.resolved_at).toBeTruthy();
    expect(guild.resolveApproval("gate_missing", "approved")).toBeNull();
  });
});

describe("band adapter (mock)", () => {
  it("wraps the event bus and tracks topics and subscribers", () => {
    const { band } = getAdapters();
    const seen: string[] = [];
    const unsubscribe = band.subscribe(RUN, (event) => seen.push(event.event_type));

    band.emit({ run_id: RUN, event_type: "assignment.uploaded", source_agent: "assignment_architect" });

    expect(seen).toEqual(["assignment.uploaded"]);
    expect(band.history(RUN)).toHaveLength(1);
    expect(band.topicSubscriberCount(RUN)).toBe(1);
    expect(band.listTopics()).toContain(RUN);

    unsubscribe();
    expect(band.topicSubscriberCount(RUN)).toBe(0);
  });
});

describe("actian adapter (mock)", () => {
  it("finds student context filtered by concept", async () => {
    const { actian } = getAdapters();
    await actian.upsertStudentContext([
      {
        student_id: "s1",
        concept_id: "integer_operations",
        mastery: { score: 0.4, confidence: 0.7, trend: "flat" },
        recent_misconceptions: ["sign_error_negatives"],
        supports: ["chunked_instructions"],
        successful_scaffolds: ["number line"],
      },
      {
        student_id: "s1",
        concept_id: "distributive_property",
        mastery: { score: 0.6, confidence: 0.6, trend: "rising" },
        recent_misconceptions: [],
        supports: ["chunked_instructions"],
        successful_scaffolds: [],
      },
    ]);

    const relevant = await actian.findRelevantStudentContext(["integer_operations"]);
    expect(relevant).toHaveLength(1);
    expect(relevant[0].concept_id).toBe("integer_operations");
    expect(await actian.findRelevantStudentContext(["equation_sequencing"])).toEqual([]);
  });

  it("stores learning observations and group snapshots per run", async () => {
    const { actian } = getAdapters();
    const observation = await actian.writeLearningObservation({
      run_id: RUN,
      student_id: "s2",
      concept_id: "distributive_property",
      observation: "Distributed to the first term only.",
      evidence_refs: ["submission:s2:q3"],
    });
    expect(observation.observation_id).toMatch(/^obs_/);

    await actian.saveGroupSnapshot(RUN, [emberRoom]);
    const snapshots = await actian.getGroupSnapshots(RUN);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].rooms[0].room_id).toBe("ember");
    expect(await actian.getLearningObservations(RUN)).toHaveLength(1);
  });
});

describe("model adapter (mock)", () => {
  it("returns deterministic output for the same request", async () => {
    const { model } = getAdapters();
    const request = { task: "concept_extraction" as const, prompt: "Extract concepts" };
    const first = await model.generate(request);
    const second = await model.generate(request);

    expect(first.deterministic).toBe(true);
    expect(first.provider).toBe("mock");
    expect(first.output).toEqual(second.output);
  });

  it("validates output against a provided schema and honors overrides", async () => {
    const { model } = getAdapters();
    const schema = z.object({ misconception_id: z.string(), explanation: z.string() });
    const response = await model.generate(
      { task: "misconception_explanation", prompt: "Explain" },
      schema,
    );
    expect(response.output.misconception_id).toBe("sign_error_negatives");

    model.setMockResponse("misconception_explanation", {
      misconception_id: "partial_distribution",
      explanation: "Only the first term was multiplied.",
    });
    const overridden = await model.generate(
      { task: "misconception_explanation", prompt: "Explain" },
      schema,
    );
    expect(overridden.output.misconception_id).toBe("partial_distribution");
  });
});

describe("replay adapter (mock)", () => {
  it("is a no-op when the key is missing", () => {
    const { replay } = getAdapters();
    const result = replay.init();
    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("REPLAY_API_KEY");
  });
});

describe("adapter factory", () => {
  it("reports mock status for every adapter with no keys set", () => {
    const status = getAdapterStatus();
    expect(status).toHaveLength(5);
    for (const entry of status) {
      expect(entry.effective_mode).toBe("mock");
      expect(entry.keys_present).toBe(false);
    }
  });

  it("returns the same singleton bundle across calls", () => {
    expect(getAdapters()).toBe(getAdapters());
  });
});
