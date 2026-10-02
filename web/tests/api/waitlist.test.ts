import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryLimits } from "@/lib/demo/rate-limit";

type Call = { table: string; op: "insert" | "upsert"; row: Record<string, unknown>; options?: unknown };
const calls: Call[] = [];
let store: { from: (table: string) => object } | null = null;

vi.mock("@/lib/server/supabase", () => ({ serviceClient: () => store }));
const notifyOwner = vi.fn(async () => true);
vi.mock("@/lib/server/notify", () => ({ notifyOwner: (...args: unknown[]) => notifyOwner(...(args as [])) }));

const { POST } = await import("@/app/api/waitlist/route");

function fakeStore() {
  return {
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => {
        calls.push({ table, op: "insert", row });
        return { error: null };
      },
      upsert: async (row: Record<string, unknown>, options?: unknown) => {
        calls.push({ table, op: "upsert", row, options });
        return { error: null };
      },
    }),
  };
}

let ip = 0;
function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `192.0.2.${++ip}` },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  calls.length = 0;
  store = null;
  notifyOwner.mockClear();
  vi.stubEnv("WAITLIST_WEBHOOK_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("KV_REST_API_URL", "");
  resetMemoryLimits();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/waitlist without a store", () => {
  it("accepts a signup and keeps the email out of the logs", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await post({ email: "Sam@School.edu", source: "hero" });
    expect(await res.json()).toEqual({ ok: true });
    for (const call of [...info.mock.calls, ...log.mock.calls]) {
      expect(call.join(" ").toLowerCase()).not.toContain("sam@school.edu");
    }
  });

  it("rejects an invalid email", async () => {
    const res = await post({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/waitlist with Supabase", () => {
  beforeEach(() => {
    store = fakeStore();
  });

  it("upserts a signup by email with its source", async () => {
    await post({ email: "sam@school.edu", source: "hero" });
    expect(calls).toEqual([
      { table: "waitlist", op: "upsert", row: { email: "sam@school.edu", source: "hero" }, options: { onConflict: "email" } },
    ]);
  });

  it("adds the beta opt-in and campus without overwriting the source", async () => {
    await post({ email: "sam@school.edu", source: "hero", beta: true, campus: "Ohio State" });
    expect(calls[0].row).toEqual({ email: "sam@school.edu", beta_opt_in: true, campus: "Ohio State" });
  });

  it("stores a Teams request and emails the owner", async () => {
    await post({ email: "dana@college.edu", source: "teams", name: "Dana", org: "Career Center", seats: "200", notes: "Spring" });
    expect(calls[0]).toMatchObject({ table: "pilot_requests", op: "insert", row: { email: "dana@college.edu", org: "Career Center" } });
    expect(notifyOwner).toHaveBeenCalledTimes(1);
  });

  it("drops fields that are not on the allowlist", async () => {
    await post({ email: "sam@school.edu", source: "hero", is_admin: true });
    expect(calls[0].row).not.toHaveProperty("is_admin");
  });
});
