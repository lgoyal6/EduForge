/**
 * Mock Model adapter: deterministic canned responses per task so the demo
 * runs offline. B/C can override any task's output with seed-derived
 * fixtures via setMockResponse. Optional live provider mode stays behind
 * env vars; until a live implementation lands it falls back here.
 */
import type { z } from "zod";
import type {
  AdapterInfo,
  ModelAdapter,
  ModelRequest,
  ModelResponse,
  ModelTask,
} from "./types";

const DEFAULT_FIXTURES: Record<ModelTask, unknown> = {
  concept_extraction: {
    concepts: [
      { concept_id: "integer_operations", label: "Integer Operations", emphasis: 0.35 },
      { concept_id: "distributive_property", label: "Distributive Property", emphasis: 0.3 },
      { concept_id: "equation_sequencing", label: "Equation Sequencing", emphasis: 0.2 },
      { concept_id: "combining_like_terms", label: "Combining Like Terms", emphasis: 0.15 },
    ],
  },
  variant_generation: {
    adaptation_summary:
      "Same objectives, adjusted pathway: worked example first, then scaffolded practice, then independent items.",
    objective_preserved: true,
    rigor_preserved: true,
  },
  misconception_explanation: {
    misconception_id: "sign_error_negatives",
    explanation:
      "The student treats subtraction of a negative as subtraction of a positive, dropping the sign flip.",
    recommended_intervention: "Number-line warm-up contrasting -(-3) and -(+3) before re-attempting.",
  },
  lesson_plan_synthesis: {
    whole_class_intervention: "Ten-minute distribution mini-lesson with a shared error-analysis example.",
    room_rotations: {
      ember: "Quick check on integer sign fluency.",
      forge: "Targeted box-model distribution practice.",
      harbor: "Sequencing transfer task with step cards.",
      summit: "Extension: justify each transformation in writing.",
    },
  },
};

type ModelState = {
  overrides: Partial<Record<ModelTask, unknown>>;
};

const GLOBAL_KEY = "__eduforge_model_mock__";

function getState(): ModelState {
  const store = globalThis as Record<string, unknown>;
  if (!store[GLOBAL_KEY]) {
    store[GLOBAL_KEY] = { overrides: {} } satisfies ModelState;
  }
  return store[GLOBAL_KEY] as ModelState;
}

export function createMockModelAdapter(): ModelAdapter {
  return {
    info(): AdapterInfo {
      return { name: "model", mode: "mock", provider: "deterministic-fixtures" };
    },

    async generate<T = unknown>(request: ModelRequest, schema?: z.ZodType<T>): Promise<ModelResponse<T>> {
      const state = getState();
      const raw = state.overrides[request.task] ?? DEFAULT_FIXTURES[request.task];
      const output = schema ? schema.parse(raw) : (raw as T);
      return {
        task: request.task,
        provider: "mock",
        deterministic: true,
        output,
      };
    },

    setMockResponse(task: ModelTask, output: unknown): void {
      getState().overrides[task] = output;
    },
  };
}

/** Test/demo-reset helper. */
export function resetMockModel(): void {
  const store = globalThis as Record<string, unknown>;
  delete store[GLOBAL_KEY];
}
