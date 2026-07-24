/**
 * Environment configuration for sponsor integrations.
 *
 * SPONSOR_MODE defaults to "mock" so the demo never depends on external
 * services. Even in "live" mode, any adapter whose keys are missing falls
 * back to its mock implementation with a one-time warning instead of
 * breaking the demo.
 */

export type SponsorMode = "mock" | "live";

export type AdapterName = "guild" | "band" | "actian" | "model" | "replay";

export const adapterNames = ["guild", "band", "actian", "model", "replay"] as const satisfies readonly AdapterName[];

export type EnvConfig = {
  sponsorMode: SponsorMode;
  modelProvider: string;
  modelApiKey: string | null;
  actianUrl: string | null;
  actianApiKey: string | null;
  guildApiKey: string | null;
  bandApiKey: string | null;
  replayApiKey: string | null;
};

function readOptional(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getEnvConfig(): EnvConfig {
  const rawMode = process.env.SPONSOR_MODE?.trim().toLowerCase();
  return {
    sponsorMode: rawMode === "live" ? "live" : "mock",
    modelProvider: readOptional("MODEL_PROVIDER") ?? "mock",
    modelApiKey: readOptional("MODEL_API_KEY"),
    actianUrl: readOptional("ACTIAN_URL"),
    actianApiKey: readOptional("ACTIAN_API_KEY"),
    guildApiKey: readOptional("GUILD_API_KEY"),
    bandApiKey: readOptional("BAND_API_KEY"),
    replayApiKey: readOptional("REPLAY_API_KEY"),
  };
}

const keyRequirements: Record<AdapterName, (config: EnvConfig) => boolean> = {
  guild: (config) => config.guildApiKey !== null,
  band: (config) => config.bandApiKey !== null,
  actian: (config) => config.actianUrl !== null && config.actianApiKey !== null,
  model: (config) => config.modelProvider !== "mock" && config.modelApiKey !== null,
  replay: (config) => config.replayApiKey !== null,
};

/** True when every credential the adapter needs for live mode is present. */
export function hasRequiredKeys(adapter: AdapterName, config: EnvConfig = getEnvConfig()): boolean {
  return keyRequirements[adapter](config);
}

const WARNED_KEY = "__eduforge_adapter_warnings__";

function warnedSet(): Set<string> {
  const store = globalThis as Record<string, unknown>;
  if (!store[WARNED_KEY]) {
    store[WARNED_KEY] = new Set<string>();
  }
  return store[WARNED_KEY] as Set<string>;
}

/**
 * Resolve the effective mode for one adapter. Only returns "live" when
 * SPONSOR_MODE=live AND the adapter's keys are present; otherwise "mock",
 * warning once per adapter when live was requested but keys are missing.
 */
export function resolveAdapterMode(adapter: AdapterName, config: EnvConfig = getEnvConfig()): SponsorMode {
  if (config.sponsorMode !== "live") {
    return "mock";
  }
  if (hasRequiredKeys(adapter, config)) {
    return "live";
  }
  const warned = warnedSet();
  if (!warned.has(adapter)) {
    warned.add(adapter);
    console.warn(
      `[config] SPONSOR_MODE=live but required keys for "${adapter}" are missing; falling back to mock adapter.`,
    );
  }
  return "mock";
}

/** Test helper: allow fallback warnings to fire again. */
export function resetAdapterWarnings(): void {
  warnedSet().clear();
}
