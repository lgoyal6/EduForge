import {
  createRunRequestSchema,
  runStateSchema,
  type AgentResult,
  type AssignmentAnalysis,
  type AccessibilityPlan,
  type CreateRunRequest,
  type GroupingPlan,
  type ReviewItem,
  type RunState,
  type StudentContextBundle,
  type VariantBundle,
} from "@/contracts";
import { getSeedAssignment } from "@/seed/assignment";
import { getSeedStudents } from "@/seed/students";
import { createAgentContext } from "./agentRuntime";
import { DeterministicClock, stableStringify } from "./deterministic";
import { emitEvent } from "./eventBridge";
import {
  appendRunEvent,
  nextEventSequence,
  nextRunId,
  putRun,
  runClock,
  setRunStatus,
  updateRun,
} from "./runStore";
import { runAssignmentArchitect } from "./agents/assignmentArchitect";
import { runStudentMemory } from "./agents/studentMemory";
import { runGrouping } from "./agents/grouping";
import { runAccessibility } from "./agents/accessibility";
import { runAssignmentCurator } from "./agents/assignmentCurator";

/**
 * The deterministic upload-to-variants loop.
 *
 * assignment.uploaded
 *   -> assignment.concepts.extracted   (Assignment Architect)
 *   -> student.context.ready           (Student Memory Agent)
 *   -> groups.proposed                 (Grouping Agent)
 *   -> accessibility.layers.ready      (Accessibility Agent)
 *   -> assignment.variants.ready       (Assignment Curator)
 *
 * Everything downstream of `assignment.variants.ready` belongs to Person C.
 */

export class AssignmentNotFoundError extends Error {
  constructor(assignmentId: string) {
    super(`No seed assignment with id "${assignmentId}"`);
    this.name = "AssignmentNotFoundError";
  }
}

export type CoreLoopResults = {
  architect: AgentResult<AssignmentAnalysis>;
  memory: AgentResult<StudentContextBundle>;
  grouping: AgentResult<GroupingPlan>;
  accessibility: AgentResult<AccessibilityPlan>;
  curator: AgentResult<VariantBundle>;
};

export type CreateRunOutcome = {
  state: RunState;
  results: CoreLoopResults;
};

function reviewItemFor(
  runId: string,
  result: AgentResult<unknown>,
  index: number,
  reason: string,
): ReviewItem {
  return {
    review_id: `rev_${runId}_${String(index).padStart(2, "0")}`,
    run_id: runId,
    agent: result.agent,
    review_type: "final_plan",
    subject_id: runId,
    reason,
    evidence_refs: result.evidence_refs.slice(0, 8),
    status: "pending",
  };
}

export function createRun(request: CreateRunRequest = {}): CreateRunOutcome {
  const parsed = createRunRequestSchema.parse(request);
  const demoMode = parsed.demo_mode ?? true;

  const assignment = demoMode
    ? getSeedAssignment(parsed.assignment_id)
    : (parsed.assignment ?? getSeedAssignment(parsed.assignment_id));

  if (!assignment) {
    throw new AssignmentNotFoundError(parsed.assignment_id ?? "unknown");
  }

  const teachingIntent = parsed.teaching_intent ?? assignment.teaching_intent;
  const students = getSeedStudents();

  const clock = new DeterministicClock();
  const runId = nextRunId({
    assignment_id: assignment.assignment_id,
    teaching_intent: teachingIntent,
    demo_mode: demoMode,
    student_fingerprint: stableStringify(students.map((s) => s.student_id)),
  });

  const initialState: RunState = {
    run_id: runId,
    status: "created",
    created_at: clock.peek(),
    demo_mode: demoMode,
    teaching_intent: teachingIntent,
    assignment,
    concepts: [],
    students,
    student_contexts: [],
    rooms: [],
    grouping: null,
    accessibility: null,
    variants: [],
    assessments: [],
    review_queue: [],
    events: [],
  };

  putRun(initialState, clock);

  // The professor hands the document over. The Architect is the owning agent
  // for this event because it is the first consumer.
  const uploadEvent = emitEvent({
    event_type: "assignment.uploaded",
    run_id: runId,
    source_agent: "assignment_architect",
    timestamp: runClock(runId).next(),
    sequence: nextEventSequence(runId),
    payload: {
      assignment_id: assignment.assignment_id,
      title: assignment.title,
      course: assignment.course,
      source: assignment.source,
      question_count: assignment.questions.length,
      objective_count: assignment.objectives.length,
      teaching_intent: teachingIntent,
      demo_mode: demoMode,
      assignment,
    },
  });
  appendRunEvent(runId, uploadEvent);
  setRunStatus(runId, "analyzing");

  const ctx = createAgentContext(runId);

  const architect = runAssignmentArchitect(ctx, assignment);
  updateRun(runId, (state) => ({
    ...state,
    concepts: architect.result.concepts,
  }));

  const memory = runStudentMemory(ctx, students, architect.result);
  updateRun(runId, (state) => ({
    ...state,
    student_contexts: memory.result.contexts,
  }));

  const grouping = runGrouping(ctx, memory.result.contexts, architect.result);
  updateRun(runId, (state) => ({
    ...state,
    rooms: grouping.result.rooms,
    grouping: grouping.result,
    status: "grouped",
  }));

  const accessibility = runAccessibility(
    ctx,
    memory.result.contexts,
    grouping.result,
  );
  updateRun(runId, (state) => ({
    ...state,
    accessibility: accessibility.result,
  }));

  const curator = runAssignmentCurator(
    ctx,
    assignment,
    grouping.result,
    accessibility.result,
  );

  const results: CoreLoopResults = {
    architect,
    memory,
    grouping,
    accessibility,
    curator,
  };

  const reviewQueue: ReviewItem[] = [];
  const reviewReasons: Array<[AgentResult<unknown>, string]> = [
    [architect, "Assignment analysis did not cover every declared objective."],
    [memory, "Stored mastery confidence is too low for at least one student."],
    [grouping, "Room placements are not decisively separated."],
    [accessibility, "Accessibility delivery layer needs professor confirmation."],
    [curator, "A variant failed an objective preservation or rigour check."],
  ];
  for (const [result, reason] of reviewReasons) {
    if (result.human_review_required) {
      reviewQueue.push(
        reviewItemFor(runId, result, reviewQueue.length + 1, reason),
      );
    }
  }

  const finalState = updateRun(runId, (state) => ({
    ...state,
    variants: curator.result.variants,
    review_queue: [...state.review_queue, ...reviewQueue],
    status: "variants_ready",
  }));

  // Fail loudly rather than serve a state that violates the shared contract.
  return { state: runStateSchema.parse(finalState), results };
}
