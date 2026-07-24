/**
 * Mock Replay adapter: demo-reliability/debugging hook. With no key it is a
 * visible no-op — init reports disabled and marks only log a console marker.
 */
import { getEnvConfig, hasRequiredKeys } from "@/server/config";
import type { AdapterInfo, ReplayAdapter } from "./types";

export function createMockReplayAdapter(): ReplayAdapter {
  return {
    info(): AdapterInfo {
      return { name: "replay", mode: "mock", provider: "console-marker" };
    },

    init() {
      if (!hasRequiredKeys("replay", getEnvConfig())) {
        return { enabled: false, reason: "REPLAY_API_KEY missing; replay recording disabled (no-op)." };
      }
      console.log("[replay] mock recorder initialized");
      return { enabled: true, reason: "Mock recorder active (console markers only)." };
    },

    mark(label: string): void {
      console.log(`[replay] marker: ${label}`);
    },
  };
}
