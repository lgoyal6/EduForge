/**
 * Shared team contracts. Frozen after scaffold.
 *
 * Source of truth: docs/CONTRACTS.md
 *
 * Names in this file are the team API. Backend owners (Person B/C/D) import the
 * same symbols. Do not rename without team agreement.
 */

export const eventTypes = [
  "assignment.uploaded",
  "assignment.concepts.extracted",
  "student.context.ready",
  "groups.proposed",
  "accessibility.layers.ready",
  "assignment.variants.ready",
  "submissions.received",
  "assessment.completed",
  "student.models.updated",
  "lesson.plan.ready",
  "approval.requested",
] as const;

export type EventType = (typeof eventTypes)[number];

export const agentNames = [
  "assignment_architect",
  "student_memory_agent",
  "grouping_agent",
  "accessibility_agent",
  "assignment_curator",
  "assessment_agent",
  "classroom_evolution_agent",
  "lesson_planner",
] as const;

export type AgentName = (typeof agentNames)[number];

export type AgentEvent = {
  event_id: string;
  event_type: EventType;
  run_id: string;
  source_agent: AgentName;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type AgentStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "needs_review";

export type AgentResult<T> = {
  run_id: string;
  agent: AgentName;
  status: AgentStatus;
  confidence: number;
  evidence_refs: string[];
  result: T;
  human_review_required: boolean;
};

export const conceptIds = [
  "integer_operations",
  "distributive_property",
  "equation_sequencing",
  "combining_like_terms",
] as const;

export type ConceptId = (typeof conceptIds)[number];

export const supportIds = [
  "extended_time",
  "read_aloud",
  "chunked_steps",
  "visual_model",
  "reduced_language_load",
  "manipulatives",
] as const;

export type SupportId = (typeof supportIds)[number];

export const misconceptionIds = [
  "sign_drop_on_distribution",
  "combines_unlike_terms",
  "reverses_inverse_operation",
  "distributes_only_first_term",
  "loses_track_of_multi_step_order",
] as const;

export type MisconceptionId = (typeof misconceptionIds)[number];

export const roomIds = ["ember", "forge", "harbor", "summit"] as const;

export type RoomId = (typeof roomIds)[number];

export type RoomName = "Ember" | "Forge" | "Harbor" | "Summit";

export type MasteryEstimate = {
  score: number;
  confidence: number;
  trend: "rising" | "flat" | "falling";
};

export type Student = {
  student_id: string;
  display_name: string;
  avatar_key: string;
  supports: SupportId[];
  mastery: Record<ConceptId, MasteryEstimate>;
  recent_patterns: MisconceptionId[];
  scaffolding_level: 1 | 2 | 3 | 4;
  last_room?: RoomId;
};

export type Room = {
  room_id: RoomId;
  name: RoomName;
  focus_concepts: ConceptId[];
  dominant_barrier: string;
  evidence_refs: string[];
  members: string[];
  base_adaptation: string;
  explanation: string;
};

export type Assignment = {
  assignment_id: string;
  title: string;
  subject: string;
  grade_band: string;
  teaching_intent: string;
  source_text: string;
  problems: AssignmentProblem[];
};

export type AssignmentProblem = {
  problem_id: string;
  prompt: string;
  concepts: ConceptId[];
};

export type ConceptSummary = {
  concept_id: ConceptId;
  label: string;
  description: string;
  problem_refs: string[];
  prerequisite_of: ConceptId[];
};

/**
 * A room-level rewrite of the assignment, plus optional per-student delivery
 * layers. The learning objective is preserved; only the pathway changes.
 */
export type AssignmentVariant = {
  variant_id: string;
  room_id: RoomId;
  title: string;
  objective_preserved: boolean;
  objective_statement: string;
  adaptation_summary: string;
  rationale: string;
  problems: AssignmentProblem[];
  student_layers: StudentLayer[];
};

export type StudentLayer = {
  student_id: string;
  supports_applied: SupportId[];
  delivery_notes: string;
  problems: AssignmentProblem[];
};

export type AssessmentResult = {
  assessment_id: string;
  student_id: string;
  room_id: RoomId;
  score: number;
  confidence: number;
  misconceptions: MisconceptionId[];
  evidence_refs: string[];
  human_review_required: boolean;
  narrative: string;
};

export type LessonPlan = {
  plan_id: string;
  run_id: string;
  headline: string;
  items: LessonPlanItem[];
};

export type LessonPlanItem = {
  item_id: string;
  title: string;
  room_id?: RoomId;
  student_ids: string[];
  concept_focus: ConceptId[];
  action: string;
  rationale: string;
  evidence_refs: string[];
  minutes: number;
};

export type ReviewItem = {
  review_id: string;
  reason: string;
  agent: AgentName;
  confidence: number;
  subject_ref: string;
  evidence_refs: string[];
  status: "open" | "approved" | "rejected";
};

export type RunStatus =
  | "created"
  | "analyzing"
  | "grouped"
  | "variants_ready"
  | "assessed"
  | "planned";

export type RunState = {
  run_id: string;
  status: RunStatus;
  assignment: Assignment;
  concepts: ConceptSummary[];
  students: Student[];
  rooms: Room[];
  variants: AssignmentVariant[];
  assessments: AssessmentResult[];
  lesson_plan?: LessonPlan;
  review_queue: ReviewItem[];
  events: AgentEvent[];
};

/** Request body for `POST /api/runs`. */
export type CreateRunRequest = {
  assignment_text: string;
  teaching_intent: string;
  title?: string;
};

/** Response body for `POST /api/runs`. */
export type CreateRunResponse = {
  run_id: string;
  status: RunStatus;
};

export function isEventType(value: unknown): value is EventType {
  return (
    typeof value === "string" && (eventTypes as readonly string[]).includes(value)
  );
}

export function isAgentName(value: unknown): value is AgentName {
  return (
    typeof value === "string" && (agentNames as readonly string[]).includes(value)
  );
}

/**
 * Narrow an unknown value (SSE frame, replay JSON, fixture) to an AgentEvent.
 * Payload contents stay unknown on purpose: consumers read them defensively.
 */
export function isAgentEvent(value: unknown): value is AgentEvent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.event_id === "string" &&
    typeof candidate.run_id === "string" &&
    typeof candidate.timestamp === "string" &&
    isEventType(candidate.event_type) &&
    isAgentName(candidate.source_agent) &&
    typeof candidate.payload === "object" &&
    candidate.payload !== null
  );
}
