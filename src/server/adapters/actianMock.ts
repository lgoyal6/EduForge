/**
 * Mock Actian adapter: in-memory structured classroom records and learning
 * observations. Deterministic — returns exactly what was written, filtered
 * by concept relevance.
 */
import type { ConceptId, Room } from "@/contracts";
import type {
  ActianAdapter,
  AdapterInfo,
  GroupSnapshot,
  LearningObservation,
  LearningObservationInput,
  StudentContextRecord,
} from "./types";

type ActianState = {
  context: Map<string, StudentContextRecord>;
  observations: LearningObservation[];
  snapshots: GroupSnapshot[];
  counter: number;
};

const GLOBAL_KEY = "__eduforge_actian_mock__";

function getState(): ActianState {
  const store = globalThis as Record<string, unknown>;
  if (!store[GLOBAL_KEY]) {
    store[GLOBAL_KEY] = {
      context: new Map(),
      observations: [],
      snapshots: [],
      counter: 0,
    } satisfies ActianState;
  }
  return store[GLOBAL_KEY] as ActianState;
}

function contextKey(record: StudentContextRecord): string {
  return `${record.student_id}:${record.concept_id}`;
}

export function createMockActianAdapter(): ActianAdapter {
  return {
    info(): AdapterInfo {
      return { name: "actian", mode: "mock", provider: "in-memory" };
    },

    async upsertStudentContext(records: StudentContextRecord[]): Promise<number> {
      const state = getState();
      for (const record of records) {
        state.context.set(contextKey(record), record);
      }
      return records.length;
    },

    async findRelevantStudentContext(concepts: ConceptId[]): Promise<StudentContextRecord[]> {
      const wanted = new Set(concepts);
      return [...getState().context.values()].filter((record) => wanted.has(record.concept_id));
    },

    async writeLearningObservation(input: LearningObservationInput): Promise<LearningObservation> {
      const state = getState();
      state.counter += 1;
      const observation: LearningObservation = {
        ...input,
        observation_id: `obs_${String(state.counter).padStart(4, "0")}`,
        recorded_at: new Date().toISOString(),
      };
      state.observations.push(observation);
      return observation;
    },

    async getLearningObservations(runId: string): Promise<LearningObservation[]> {
      return getState().observations.filter((observation) => observation.run_id === runId);
    },

    async saveGroupSnapshot(runId: string, rooms: Room[]): Promise<GroupSnapshot> {
      const state = getState();
      state.counter += 1;
      const snapshot: GroupSnapshot = {
        snapshot_id: `snap_${String(state.counter).padStart(4, "0")}`,
        run_id: runId,
        rooms: structuredClone(rooms),
        captured_at: new Date().toISOString(),
      };
      state.snapshots.push(snapshot);
      return snapshot;
    },

    async getGroupSnapshots(runId: string): Promise<GroupSnapshot[]> {
      return getState().snapshots.filter((snapshot) => snapshot.run_id === runId);
    },
  };
}

/** Test/demo-reset helper. */
export function resetMockActian(): void {
  const store = globalThis as Record<string, unknown>;
  delete store[GLOBAL_KEY];
}
