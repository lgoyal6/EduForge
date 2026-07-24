import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnvConfig, hasRequiredKeys, resetAdapterWarnings, resolveAdapterMode } from "./env";

const ENV_KEYS = [
  "SPONSOR_MODE",
  "MODEL_PROVIDER",
  "MODEL_API_KEY",
  "ACTIAN_URL",
  "ACTIAN_API_KEY",
  "GUILD_API_KEY",
  "BAND_API_KEY",
  "REPLAY_API_KEY",
];

describe("env config", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, "");
    }
    resetAdapterWarnings();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to mock mode with mock model provider", () => {
    const config = getEnvConfig();
    expect(config.sponsorMode).toBe("mock");
    expect(config.modelProvider).toBe("mock");
    expect(config.guildApiKey).toBeNull();
  });

  it("treats unknown SPONSOR_MODE values as mock", () => {
    vi.stubEnv("SPONSOR_MODE", "production");
    expect(getEnvConfig().sponsorMode).toBe("mock");
  });

  it("resolves every adapter to mock when SPONSOR_MODE=mock, even with keys", () => {
    vi.stubEnv("GUILD_API_KEY", "guild-key");
    expect(resolveAdapterMode("guild")).toBe("mock");
  });

  it("falls back to mock with a warning when live mode lacks keys", () => {
    vi.stubEnv("SPONSOR_MODE", "live");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(resolveAdapterMode("guild")).toBe("mock");
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // warning is one-time per adapter
    expect(resolveAdapterMode("guild")).toBe("mock");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("resolves live only when required keys are present", () => {
    vi.stubEnv("SPONSOR_MODE", "live");
    vi.stubEnv("BAND_API_KEY", "band-key");
    expect(resolveAdapterMode("band")).toBe("live");

    // actian needs both url and key
    vi.stubEnv("ACTIAN_URL", "https://actian.example");
    expect(hasRequiredKeys("actian")).toBe(false);
    vi.stubEnv("ACTIAN_API_KEY", "actian-key");
    expect(hasRequiredKeys("actian")).toBe(true);
  });

  it("model adapter needs a non-mock provider and a key for live mode", () => {
    vi.stubEnv("SPONSOR_MODE", "live");
    vi.stubEnv("MODEL_API_KEY", "model-key");
    expect(hasRequiredKeys("model")).toBe(false);
    vi.stubEnv("MODEL_PROVIDER", "anthropic");
    expect(hasRequiredKeys("model")).toBe(true);
    expect(resolveAdapterMode("model")).toBe("live");
  });
});
