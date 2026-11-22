import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "./circuit-breaker";

describe("external API circuit breaker", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens after repeated failures and avoids another external call", async () => {
    const breaker = new CircuitBreaker(3, 30_000);
    const failure = vi.fn().mockRejectedValue(new Error("offline"));
    for (let attempt = 0; attempt < 3; attempt++) await expect(breaker.run(failure)).rejects.toThrow("offline");
    await expect(breaker.run(failure)).rejects.toThrow("Circuit breaker is open");
    expect(failure).toHaveBeenCalledTimes(3);
  });

  it("recovers after cooldown and resets the failure count", async () => {
    const breaker = new CircuitBreaker(1, 30_000);
    await expect(breaker.run(async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    vi.advanceTimersByTime(30_001);
    await expect(breaker.run(async () => "ok")).resolves.toBe("ok");
    await expect(breaker.run(async () => "still ok")).resolves.toBe("still ok");
  });
});
