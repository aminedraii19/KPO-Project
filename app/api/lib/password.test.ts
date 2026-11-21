import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the original password and rejects a wrong one", async () => {
    const stored = await hashPassword("Teacher123");
    expect(stored).not.toContain("Teacher123");
    expect(await verifyPassword("Teacher123", stored)).toBe(true);
    expect(await verifyPassword("Teacher124", stored)).toBe(false);
  });

  it("uses a random salt for equal passwords", async () => {
    expect(await hashPassword("Teacher123")).not.toBe(await hashPassword("Teacher123"));
  });

  it("fails closed for malformed stored hashes", async () => {
    expect(await verifyPassword("Teacher123", "broken")).toBe(false);
    expect(await verifyPassword("Teacher123", "salt:not-hex")).toBe(false);
  });
});
