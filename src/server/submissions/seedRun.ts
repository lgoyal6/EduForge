/**
 * Fallback seed run — Person C owned.
 *
 * Person B owns run creation (`POST /api/runs`, `src/server/runStore.ts`,
 * `src/seed/students.ts`, `src/seed/assignment.ts`). Until that branch merges,
 * this module builds a deterministic RunState frozen at `variants_ready` —
 * exactly the state Person C's half of the loop consumes. At integration,
 * replace `getOrCreateRun` in ./runProvider with Person B's store; nothing in
 * the agents depends on this file's internals.
 */
import type {
  Assignment,
  AssignmentVariant,
  ConceptSummary,
  Room,
  RunState,
  Student,
} from "@/contracts";

export const DEMO_ASSIGNMENT: Assignment = {
  assignment_id: "asgn-multistep-001",
  title: "Multi-Step Equations Check-In",
  subject: "Algebra I",
  teaching_intent: "Check that multi-step equation solving transfers after this week's room interventions.",
  questions: [
    {
      question_id: "q1",
      prompt: "Solve: x + 7 = -4",
      concept_ids: ["integer_operations"],
      difficulty: 1,
    },
    {
      question_id: "q2",
      prompt: "Solve: 5x - 3x + 4 = -6",
      concept_ids: ["integer_operations", "combining_like_terms"],
      difficulty: 2,
    },
    {
      question_id: "q3",
      prompt: "Solve: 3(x + 4) = 30",
      concept_ids: ["distributive_property"],
      difficulty: 2,
    },
    {
      question_id: "q4",
      prompt: "Solve: 2(3x - 5) + 4 = 18",
      concept_ids: ["distributive_property", "equation_sequencing"],
      difficulty: 3,
    },
    {
      question_id: "q5",
      prompt: "Solve: 4x - 9 = 2x + 5",
      concept_ids: ["equation_sequencing"],
      difficulty: 2,
    },
    {
      question_id: "q6",
      prompt: "Simplify, then solve: 7x + 2 - 4x + 1 = 12",
      concept_ids: ["combining_like_terms"],
      difficulty: 2,
    },
  ],
};

export const DEMO_CONCEPTS: ConceptSummary[] = [
  {
    concept_id: "integer_operations",
    label: "Integer operations",
    question_ids: ["q1", "q2"],
    emphasis: 0.33,
  },
  {
    concept_id: "distributive_property",
    label: "Distributive property",
    question_ids: ["q3", "q4"],
    emphasis: 0.33,
  },
  {
    concept_id: "equation_sequencing",
    label: "Equation sequencing",
    question_ids: ["q4", "q5"],
    emphasis: 0.33,
  },
  {
    concept_id: "combining_like_terms",
    label: "Combining like terms",
    question_ids: ["q2", "q6"],
    emphasis: 0.33,
  },
];

function buildStudents(): Student[] {
  return [
    // --- Ember: repeated sign errors in integer operations ----------------
    {
      student_id: "s01",
      display_name: "Maya Chen",
      avatar_key: "maya",
      supports: ["chunked_instructions", "visual_supports"],
      scaffolding_level: 3,
      last_room: "ember",
      recent_patterns: ["sign_error_negatives"],
      mastery: {
        integer_operations: { score: 0.3, confidence: 0.7, trend: "rising" },
        distributive_property: { score: 0.52, confidence: 0.6, trend: "flat" },
        equation_sequencing: { score: 0.6, confidence: 0.6, trend: "flat" },
        combining_like_terms: { score: 0.55, confidence: 0.6, trend: "flat" },
      },
    },
    {
      student_id: "s02",
      display_name: "Dev Patel",
      avatar_key: "dev",
      supports: ["extended_time"],
      scaffolding_level: 3,
      last_room: "ember",
      recent_patterns: ["sign_error_negatives"],
      mastery: {
        integer_operations: { score: 0.28, confidence: 0.65, trend: "flat" },
        distributive_property: { score: 0.5, confidence: 0.6, trend: "flat" },
        equation_sequencing: { score: 0.55, confidence: 0.6, trend: "flat" },
        combining_like_terms: { score: 0.48, confidence: 0.6, trend: "flat" },
      },
    },
    {
      student_id: "s03",
      display_name: "Jordan Reyes",
      avatar_key: "jordan",
      supports: [],
      scaffolding_level: 2,
      last_room: "ember",
      recent_patterns: ["sign_error_negatives"],
      mastery: {
        integer_operations: { score: 0.34, confidence: 0.7, trend: "rising" },
        distributive_property: { score: 0.6, confidence: 0.65, trend: "flat" },
        equation_sequencing: { score: 0.62, confidence: 0.65, trend: "flat" },
        combining_like_terms: { score: 0.58, confidence: 0.6, trend: "flat" },
      },
    },
    {
      student_id: "s04",
      display_name: "Sam Okafor",
      avatar_key: "sam",
      supports: ["read_aloud"],
      scaffolding_level: 2,
      last_room: "ember",
      recent_patterns: ["sign_error_negatives"],
      mastery: {
        integer_operations: { score: 0.36, confidence: 0.7, trend: "rising" },
        distributive_property: { score: 0.58, confidence: 0.65, trend: "flat" },
        equation_sequencing: { score: 0.62, confidence: 0.6, trend: "flat" },
        combining_like_terms: { score: 0.6, confidence: 0.65, trend: "flat" },
      },
    },
    {
      student_id: "s05",
      display_name: "Lena Novak",
      avatar_key: "lena",
      supports: [],
      scaffolding_level: 2,
      last_room: "ember",
      recent_patterns: ["sign_error_negatives"],
      mastery: {
        integer_operations: { score: 0.33, confidence: 0.7, trend: "rising" },
        distributive_property: { score: 0.62, confidence: 0.65, trend: "flat" },
        equation_sequencing: { score: 0.65, confidence: 0.65, trend: "flat" },
        combining_like_terms: { score: 0.57, confidence: 0.6, trend: "flat" },
      },
    },
    // --- Forge: distributes to only the first term ------------------------
    {
      student_id: "s06",
      display_name: "Ava Thompson",
      avatar_key: "ava",
      supports: [],
      scaffolding_level: 2,
      last_room: "forge",
      recent_patterns: ["partial_distribution"],
      mastery: {
        integer_operations: { score: 0.7, confidence: 0.75, trend: "flat" },
        distributive_property: { score: 0.42, confidence: 0.65, trend: "falling" },
        equation_sequencing: { score: 0.66, confidence: 0.65, trend: "flat" },
        combining_like_terms: { score: 0.62, confidence: 0.65, trend: "flat" },
      },
    },
    {
      student_id: "s07",
      display_name: "Noah Kim",
      avatar_key: "noah",
      supports: ["reduced_distraction"],
      scaffolding_level: 2,
      last_room: "forge",
      recent_patterns: ["partial_distribution"],
      mastery: {
        integer_operations: { score: 0.68, confidence: 0.75, trend: "flat" },
        distributive_property: { score: 0.4, confidence: 0.65, trend: "falling" },
        equation_sequencing: { score: 0.64, confidence: 0.6, trend: "flat" },
        combining_like_terms: { score: 0.6, confidence: 0.65, trend: "flat" },
      },
    },
    {
      student_id: "s08",
      display_name: "Priya Raman",
      avatar_key: "priya",
      supports: ["chunked_instructions"],
      scaffolding_level: 3,
      last_room: "forge",
      recent_patterns: ["partial_distribution"],
      mastery: {
        integer_operations: { score: 0.72, confidence: 0.75, trend: "rising" },
        distributive_property: { score: 0.45, confidence: 0.65, trend: "flat" },
        equation_sequencing: { score: 0.68, confidence: 0.7, trend: "rising" },
        combining_like_terms: { score: 0.65, confidence: 0.7, trend: "rising" },
      },
    },
    {
      student_id: "s09",
      display_name: "Mateo Silva",
      avatar_key: "mateo",
      supports: [],
      scaffolding_level: 2,
      last_room: "forge",
      recent_patterns: ["partial_distribution", "like_terms_overcombine"],
      mastery: {
        integer_operations: { score: 0.66, confidence: 0.7, trend: "flat" },
        distributive_property: { score: 0.38, confidence: 0.6, trend: "falling" },
        equation_sequencing: { score: 0.62, confidence: 0.6, trend: "flat" },
        combining_like_terms: { score: 0.58, confidence: 0.6, trend: "falling" },
      },
    },
    // --- Harbor: right ideas, wrong operation order ------------------------
    {
      student_id: "s10",
      display_name: "Zoe Martin",
      avatar_key: "zoe",
      supports: [],
      scaffolding_level: 2,
      last_room: "harbor",
      recent_patterns: ["operation_order_confusion"],
      mastery: {
        integer_operations: { score: 0.74, confidence: 0.75, trend: "rising" },
        distributive_property: { score: 0.68, confidence: 0.7, trend: "rising" },
        equation_sequencing: { score: 0.45, confidence: 0.65, trend: "rising" },
        combining_like_terms: { score: 0.66, confidence: 0.7, trend: "rising" },
      },
    },
    {
      student_id: "s11",
      display_name: "Eli Johnson",
      avatar_key: "eli",
      supports: ["extended_time"],
      scaffolding_level: 2,
      last_room: "harbor",
      recent_patterns: ["operation_order_confusion"],
      mastery: {
        integer_operations: { score: 0.7, confidence: 0.7, trend: "flat" },
        distributive_property: { score: 0.52, confidence: 0.6, trend: "flat" },
        equation_sequencing: { score: 0.42, confidence: 0.6, trend: "flat" },
        combining_like_terms: { score: 0.64, confidence: 0.65, trend: "flat" },
      },
    },
    {
      student_id: "s12",
      display_name: "Hana Suzuki",
      avatar_key: "hana",
      supports: ["visual_supports"],
      scaffolding_level: 1,
      last_room: "harbor",
      recent_patterns: ["operation_order_confusion"],
      mastery: {
        integer_operations: { score: 0.76, confidence: 0.75, trend: "flat" },
        distributive_property: { score: 0.7, confidence: 0.7, trend: "flat" },
        equation_sequencing: { score: 0.48, confidence: 0.65, trend: "flat" },
        combining_like_terms: { score: 0.68, confidence: 0.7, trend: "flat" },
      },
    },
    // --- Summit: extension ---------------------------------------------------
    {
      student_id: "s13",
      display_name: "Ivy Zhang",
      avatar_key: "ivy",
      supports: [],
      scaffolding_level: 1,
      last_room: "summit",
      recent_patterns: [],
      mastery: {
        integer_operations: { score: 0.88, confidence: 0.85, trend: "rising" },
        distributive_property: { score: 0.86, confidence: 0.85, trend: "flat" },
        equation_sequencing: { score: 0.87, confidence: 0.85, trend: "rising" },
        combining_like_terms: { score: 0.89, confidence: 0.85, trend: "flat" },
      },
    },
    {
      student_id: "s14",
      display_name: "Omar Haddad",
      avatar_key: "omar",
      supports: [],
      scaffolding_level: 1,
      last_room: "summit",
      recent_patterns: [],
      mastery: {
        integer_operations: { score: 0.87, confidence: 0.85, trend: "flat" },
        distributive_property: { score: 0.86, confidence: 0.85, trend: "rising" },
        equation_sequencing: { score: 0.88, confidence: 0.85, trend: "flat" },
        combining_like_terms: { score: 0.86, confidence: 0.85, trend: "flat" },
      },
    },
    {
      student_id: "s15",
      display_name: "Grace Liu",
      avatar_key: "grace",
      supports: ["read_aloud"],
      scaffolding_level: 1,
      last_room: "summit",
      recent_patterns: [],
      mastery: {
        integer_operations: { score: 0.86, confidence: 0.85, trend: "flat" },
        distributive_property: { score: 0.85, confidence: 0.85, trend: "flat" },
        equation_sequencing: { score: 0.87, confidence: 0.85, trend: "rising" },
        combining_like_terms: { score: 0.88, confidence: 0.85, trend: "flat" },
      },
    },
  ];
}

function buildRooms(): Room[] {
  return [
    {
      room_id: "ember",
      name: "Ember",
      focus_concepts: ["integer_operations"],
      dominant_barrier: "Repeated sign errors when operating on negative integers",
      evidence_refs: ["seed:pattern:s01:sign_error_negatives", "seed:pattern:s02:sign_error_negatives"],
      members: ["s01", "s02", "s03", "s04", "s05"],
      base_adaptation: "Number-line warmups and sign-tracking margin column on every problem",
      explanation:
        "Five students show the same barrier: correct strategy, wrong signs. Grouped by barrier evidence, not labels.",
    },
    {
      room_id: "forge",
      name: "Forge",
      focus_concepts: ["distributive_property", "combining_like_terms"],
      dominant_barrier: "Distributes to only the first term inside parentheses",
      evidence_refs: ["seed:pattern:s06:partial_distribution", "seed:pattern:s09:partial_distribution"],
      members: ["s06", "s07", "s08", "s09"],
      base_adaptation: "Box/area model scaffolds before symbolic distribution",
      explanation:
        "Four students expand a(b + c) as ab + c. Grouped on that shared misconception evidence.",
    },
    {
      room_id: "harbor",
      name: "Harbor",
      focus_concepts: ["equation_sequencing"],
      dominant_barrier: "Right operations applied in the wrong order",
      evidence_refs: ["seed:pattern:s10:operation_order_confusion", "seed:pattern:s12:operation_order_confusion"],
      members: ["s10", "s11", "s12"],
      base_adaptation: "Step-planning checklist: undo addition before multiplication",
      explanation:
        "Three students know each move but sequence them wrong. Grouped by sequencing evidence.",
    },
    {
      room_id: "summit",
      name: "Summit",
      focus_concepts: [
        "integer_operations",
        "distributive_property",
        "equation_sequencing",
        "combining_like_terms",
      ],
      dominant_barrier: "Needs extension beyond grade-level mastery",
      evidence_refs: ["seed:mastery:s13", "seed:mastery:s14", "seed:mastery:s15"],
      members: ["s13", "s14", "s15"],
      base_adaptation: "Extension problems requiring written justification of each solution path",
      explanation: "Three students above 85% mastery across all four concepts; extension keeps rigor.",
    },
  ];
}

function buildVariants(): AssignmentVariant[] {
  const adaptations: Record<string, string> = {
    ember: "Same six problems with a sign-tracking margin column and integer number line reference.",
    forge: "Same six problems; parentheses problems paired with a box/area model organizer.",
    harbor: "Same six problems with an operation-order planning row above each problem.",
    summit: "Same six problems plus 'justify each step' extension prompts; no reduced rigor.",
  };
  return buildRooms().map((room) => ({
    variant_id: `var-${room.room_id}`,
    room_id: room.room_id,
    base_assignment_id: DEMO_ASSIGNMENT.assignment_id,
    adaptation_summary: adaptations[room.room_id],
    questions: DEMO_ASSIGNMENT.questions,
    student_overlays: [],
    objective_preserved: true,
    rigor_preserved: true,
  }));
}

/** A deterministic run frozen at `variants_ready`, ready for submissions. */
export function buildSeedRun(runId: string): RunState {
  return {
    run_id: runId,
    status: "variants_ready",
    assignment: DEMO_ASSIGNMENT,
    concepts: DEMO_CONCEPTS,
    students: buildStudents(),
    rooms: buildRooms(),
    variants: buildVariants(),
    assessments: [],
    review_queue: [],
    events: [],
  };
}
