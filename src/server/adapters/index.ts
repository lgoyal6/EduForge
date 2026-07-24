/**
 * Adapter factory. B and C call getAdapters() and never construct a mock or
 * live implementation directly.
 *
 * Mode resolution: SPONSOR_MODE=mock (default) always yields mocks. In live
 * mode an adapter is only "live" when its keys are present — and since no
 * live implementations ship yet, live requests fall back to mocks with a
 * one-time warning instead of breaking the demo.
 */
import {
  adapterNames,
  getEnvConfig,
  hasRequiredKeys,
  resolveAdapterMode,
  type AdapterName,
  type SponsorMode,
} from "@/server/config";
import { createMockActianAdapter, resetMockActian } from "./actianMock";
import { createMockBandAdapter, resetMockBand } from "./bandMock";
import { createMockGuildAdapter, resetMockGuild } from "./guildMock";
import { createMockModelAdapter, resetMockModel } from "./modelMock";
import { createMockReplayAdapter } from "./replayMock";
import type { SponsorAdapters } from "./types";

const GLOBAL_KEY = "__eduforge_adapters__";

function buildAdapters(): SponsorAdapters {
  // Live implementations are not built for the hackathon; resolveAdapterMode
  // still decides (and warns) so swapping in a live adapter later is a
  // one-line change per sponsor.
  for (const name of adapterNames) {
    resolveAdapterMode(name);
  }
  return {
    guild: createMockGuildAdapter(),
    band: createMockBandAdapter(),
    actian: createMockActianAdapter(),
    model: createMockModelAdapter(),
    replay: createMockReplayAdapter(),
  };
}

/** Singleton adapter bundle for the whole server process. */
export function getAdapters(): SponsorAdapters {
  const store = globalThis as Record<string, unknown>;
  if (!store[GLOBAL_KEY]) {
    store[GLOBAL_KEY] = buildAdapters();
  }
  return store[GLOBAL_KEY] as SponsorAdapters;
}

export type AdapterStatus = {
  name: AdapterName;
  requested_mode: SponsorMode;
  effective_mode: SponsorMode;
  keys_present: boolean;
};

/** Effective status per adapter — handy for logs and debugging panels. */
export function getAdapterStatus(): AdapterStatus[] {
  const config = getEnvConfig();
  return adapterNames.map((name) => ({
    name,
    requested_mode: config.sponsorMode,
    effective_mode: resolveAdapterMode(name, config),
    keys_present: hasRequiredKeys(name, config),
  }));
}

/** Test/demo-reset helper. Clears adapter singletons and mock state. */
export function resetAdapters(): void {
  const store = globalThis as Record<string, unknown>;
  delete store[GLOBAL_KEY];
  resetMockGuild();
  resetMockBand();
  resetMockActian();
  resetMockModel();
}

export * from "./types";
