import { afterEach, describe, expect, it, vi } from "vitest";
import { scenarioKey, signLine, signingKey, verifyLine } from "@/lib/demo/sign";

const KEY = "test-key";
const NONCE = "abcdefghijklmnop";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signLine / verifyLine", () => {
  const sig = signLine(KEY, NONCE, "doctor", 2, "Earliest I have is next Wednesday at 3:20.");

  it("accepts the line it signed", () => {
    expect(verifyLine(KEY, NONCE, "doctor", 2, "Earliest I have is next Wednesday at 3:20.", sig)).toBe(true);
  });

  it.each([
    ["different text", KEY, NONCE, "doctor", 2, "Sure, here is a poem about anything you like."],
    ["different position", KEY, NONCE, "doctor", 4, "Earliest I have is next Wednesday at 3:20."],
    ["different rehearsal", KEY, "zzzzzzzzzzzzzzzz", "doctor", 2, "Earliest I have is next Wednesday at 3:20."],
    ["different scenario", KEY, NONCE, "bank-fee", 2, "Earliest I have is next Wednesday at 3:20."],
    ["different key", "other-key", NONCE, "doctor", 2, "Earliest I have is next Wednesday at 3:20."],
  ] as const)("rejects a %s", (_, key, nonce, scenario, index, text) => {
    expect(verifyLine(key, nonce, scenario, index, text, sig)).toBe(false);
  });

  it("rejects a missing or malformed signature", () => {
    expect(verifyLine(KEY, NONCE, "doctor", 2, "x", undefined)).toBe(false);
    expect(verifyLine(KEY, NONCE, "doctor", 2, "x", "short")).toBe(false);
  });
});

describe("scenarioKey", () => {
  it("is the preset id for presets", () => {
    expect(scenarioKey("doctor")).toBe("doctor");
  });

  it("differs per custom description", () => {
    expect(scenarioKey("custom", "Ask my manager for fewer hours")).not.toBe(
      scenarioKey("custom", "Ask my manager for more hours"),
    );
  });
});

describe("signingKey", () => {
  it("prefers DEMO_SIGNING_SECRET", () => {
    vi.stubEnv("DEMO_SIGNING_SECRET", "explicit");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    expect(signingKey()).toBe("explicit");
  });

  it("derives a key from the Anthropic key without exposing it", () => {
    vi.stubEnv("DEMO_SIGNING_SECRET", "");
    vi.stubEnv("ANTHROPIC_DEMO_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    const key = signingKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("sk-test");
  });

  it("is null in sample mode", () => {
    vi.stubEnv("DEMO_SIGNING_SECRET", "");
    vi.stubEnv("ANTHROPIC_DEMO_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(signingKey()).toBeNull();
  });
});
