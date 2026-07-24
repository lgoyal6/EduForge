/**
 * Sponsor adapter interfaces. B and C code against these types only —
 * never against a concrete mock or live implementation.
 */
import type { z } from "zod";
import type {
  AgentEvent,
  AgentName,
  AgentResultStatus,
  ConceptId,
  MasteryEstimate,
  MisconceptionId,
  Room,
  SupportId,
} from "@/contracts";
import type { AdapterName, SponsorMode } from "@/server/config";
import type { EventInput, EventListener } from "@/server/events";

export type AdapterInfo = {
  name: AdapterName;
  mode: SponsorMode;
  provider: string;
};

// ---------------------------------------------------------------------------
// Guild: agent registry, permissions, run records, approval gates, audit
// ---------------------------------------------------------------------------

export type GuildAgentRecord = {
  agent: AgentName;
  registered_at: string;
  permissions: string[];
};

export type GuildRunRecord = {
  run_id: string;
  agent: AgentName;
  status: AgentResultStatus;
  confidence: number;
  evidence_refs: string[];
  human_review_required: boolean;
  recorded_at: string;
};

export type ApprovalGateType = "low_confidence_grade" | "final_plan";

export type ApprovalGate = {
  gate_id: string;
  run_id: string;
  gate_type: ApprovalGateType;
  subject_id: string;
  reason: string;
  evidence_refs: string[];
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  resolved_at: string | null;
};

export interface GuildAdapter {
  info(): AdapterInfo;
  /** Register one agent. Idempotent per agent name. */
  registerAgent(agent: AgentName, permissions?: string[]): GuildAgentRecord;
  /** Register all eight contract agents with default permissions. */
  registerDefaultAgents(): GuildAgentRecord[];
  listAgents(): GuildAgentRecord[];
  /** Store an agent run; opens an approval gate when review is required. */
  recordAgentRun(record: Omit<GuildRunRecord, "recorded_at">): GuildRunRecord;
  getAgentRuns(runId: string): GuildRunRecord[];
  requestApproval(input: {
    run_id: string;
    gate_type: ApprovalGateType;
    subject_id: string;
    reason: string;
    evidence_refs?: string[];
  }): ApprovalGate;
  listApprovals(runId: string): ApprovalGate[];
  resolveApproval(gateId: string, decision: "approved" | "rejected"): ApprovalGate | null;
}

// ---------------------------------------------------------------------------
// Band: agent communication mesh over the event bus
// ---------------------------------------------------------------------------

export interface BandAdapter {
  info(): AdapterInfo;
  /** Publish an already-built event envelope onto the run topic. */
  publish(event: AgentEvent): void;
  /** Build (id + timestamp) and publish an event. Returns the envelope. */
  emit(input: EventInput): AgentEvent;
  /** Subscribe to a run topic. Returns an unsubscribe function. */
  subscribe(runId: string, onEvent: EventListener): () => void;
  /** Full event history for a run topic, for UI replay. */
  history(runId: string): AgentEvent[];
  topicSubscriberCount(runId: string): number;
  /** Run topics this mesh has seen (published or subscribed). */
  listTopics(): string[];
}

// ---------------------------------------------------------------------------
// Actian: structured classroom records + learning observations
// ---------------------------------------------------------------------------

export type StudentContextRecord = {
  student_id: string;
  concept_id: ConceptId;
  mastery: MasteryEstimate;
  recent_misconceptions: MisconceptionId[];
  supports: SupportId[];
  successful_scaffolds: string[];
};

export type LearningObservation = {
  observation_id: string;
  run_id: string;
  student_id: string;
  concept_id: ConceptId;
  observation: string;
  evidence_refs: string[];
  recorded_at: string;
};

export type LearningObservationInput = Omit<LearningObservation, "observation_id" | "recorded_at">;

export type GroupSnapshot = {
  snapshot_id: string;
  run_id: string;
  rooms: Room[];
  captured_at: string;
};

export interface ActianAdapter {
  info(): AdapterInfo;
  /** Seed or refresh classroom records. Returns count stored. */
  upsertStudentContext(records: StudentContextRecord[]): Promise<number>;
  /** Records relevant to the given concepts (empty array when none). */
  findRelevantStudentContext(concepts: ConceptId[]): Promise<StudentContextRecord[]>;
  writeLearningObservation(observation: LearningObservationInput): Promise<LearningObservation>;
  getLearningObservations(runId: string): Promise<LearningObservation[]>;
  saveGroupSnapshot(runId: string, rooms: Room[]): Promise<GroupSnapshot>;
  getGroupSnapshots(runId: string): Promise<GroupSnapshot[]>;
}

// ---------------------------------------------------------------------------
// Model: structured reasoning/generation
// ---------------------------------------------------------------------------

export type ModelTask =
  | "concept_extraction"
  | "variant_generation"
  | "misconception_explanation"
  | "lesson_plan_synthesis";

export type ModelRequest = {
  task: ModelTask;
  prompt: string;
  context?: Record<string, unknown>;
};

export type ModelResponse<T = unknown> = {
  task: ModelTask;
  provider: string;
  deterministic: boolean;
  output: T;
};

export interface ModelAdapter {
  info(): AdapterInfo;
  /**
   * Generate structured output for a task. When a Zod schema is passed the
   * output is validated before it is returned.
   */
  generate<T = unknown>(request: ModelRequest, schema?: z.ZodType<T>): Promise<ModelResponse<T>>;
  /**
   * Override the deterministic response for a task (B/C hook their own
   * seed-derived fixtures in here). Mock mode only.
   */
  setMockResponse(task: ModelTask, output: unknown): void;
}

// ---------------------------------------------------------------------------
// Replay: demo reliability / debugging
// ---------------------------------------------------------------------------

export interface ReplayAdapter {
  info(): AdapterInfo;
  /** Client/server init hook. No-op (enabled: false) when key is missing. */
  init(): { enabled: boolean; reason: string };
  /** Drop a marker into the recording (console marker in mock mode). */
  mark(label: string): void;
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

export type SponsorAdapters = {
  guild: GuildAdapter;
  band: BandAdapter;
  actian: ActianAdapter;
  model: ModelAdapter;
  replay: ReplayAdapter;
};
