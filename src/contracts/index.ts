/**
 * Shared team contracts. Frozen after scaffold — see docs/CONTRACTS.md.
 * Only change through team agreement.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Agent names
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Domain identifiers
// ---------------------------------------------------------------------------

export type ConceptId =
  | "integer_operations"
  | "distributive_property"
  | "equation_sequencing"
  | "combining_like_terms";

export const conceptIds = [
  "integer_operations",
  "distributive_property",
  "equation_sequencing",
  "combining_like_terms",
] as const satisfies readonly ConceptId[];

export type SupportId =
  | "extended_time"
  | "chunked_instructions"
  | "read_aloud"
  | "visual_supports"
  | "reduced_distraction";

export type MisconceptionId =
  | "sign_error_negatives"
  | "partial_distribution"
  | "operation_order_confusion"
  | "like_terms_overcombine";

export type RoomId = "ember" | "forge" | "harbor" | "summit";

export const roomIds = ["ember", "forge", "harbor", "summit"] as const satisfies readonly RoomId[];

// ---------------------------------------------------------------------------
// Event envelope
// ---------------------------------------------------------------------------

export type AgentEvent = {
  event_id: string;
  event_type: EventType;
  run_id: string;
  source_agent: AgentName;
  timestamp: string;
  payload: Record<string, unknown>;
};

export const agentEventSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.enum(eventTypes),
  run_id: z.string().min(1),
  source_agent: z.enum(agentNames),
  timestamp: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// Agent result envelope
// ---------------------------------------------------------------------------

export type AgentResultStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "needs_review";

export type AgentResult<T> = {
  run_id: string;
  agent: AgentName;
  status: AgentResultStatus;
  confidence: number;
  evidence_refs: string[];
  result: T;
  human_review_required: boolean;
};

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export type Room = {
  room_id: RoomId;
  name: "Ember" | "Forge" | "Harbor" | "Summit";
  focus_concepts: ConceptId[];
  dominant_barrier: string;
  evidence_refs: string[];
  members: string[];
  base_adaptation: string;
  explanation: string;
};

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export type AssignmentQuestion = {
  question_id: string;
  prompt: string;
  concept_ids: ConceptId[];
  difficulty: 1 | 2 | 3;
};

export type Assignment = {
  assignment_id: string;
  title: string;
  subject: string;
  questions: AssignmentQuestion[];
  teaching_intent?: string;
};

export type ConceptSummary = {
  concept_id: ConceptId;
  label: string;
  question_ids: string[];
  emphasis: number;
};

export type StudentOverlay = {
  student_id: string;
  presentation_changes: string[];
  supports_applied: SupportId[];
};

export type AssignmentVariant = {
  variant_id: string;
  room_id: RoomId;
  base_assignment_id: string;
  adaptation_summary: string;
  questions: AssignmentQuestion[];
  student_overlays: StudentOverlay[];
  objective_preserved: boolean;
  rigor_preserved: boolean;
};

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export type QuestionResult = {
  question_id: string;
  correct: boolean;
  misconception_ids: MisconceptionId[];
  evidence: string;
};

export type AssessmentResult = {
  run_id: string;
  student_id: string;
  score: number;
  question_results: QuestionResult[];
  misconceptions: MisconceptionId[];
  confidence: number;
  review_state: "auto_approved" | "needs_review" | "approved" | "rejected";
  reasoning_trace: string[];
};

// ---------------------------------------------------------------------------
// Lesson plan
// ---------------------------------------------------------------------------

export type LessonPlanStep = {
  step_id: string;
  title: string;
  description: string;
  audience: "whole_class" | RoomId;
  duration_minutes: number;
  evidence_refs: string[];
};

export type LessonPlan = {
  run_id: string;
  timeline: LessonPlanStep[];
  whole_class_intervention: string;
  room_rotations: Record<RoomId, string>;
  evidence_refs: string[];
  approval_state: "pending" | "approved" | "rejected";
};

// ---------------------------------------------------------------------------
// Review queue
// ---------------------------------------------------------------------------

export type ReviewItem = {
  review_id: string;
  run_id: string;
  review_type: "low_confidence_grade" | "final_plan";
  subject_id: string;
  reason: string;
  evidence_refs: string[];
  status: "pending" | "approved" | "rejected";
};

// ---------------------------------------------------------------------------
// Run state
// ---------------------------------------------------------------------------

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
