import { describe, expect, it } from "vitest";
import { questionSchema, quizSchema, registerSchema } from "./schemas";

const question = {
  prompt: "Which planet is known as the red planet?",
  options: ["Mars", "Venus"],
  correctIndex: 0,
  points: 10,
  difficulty: "easy" as const,
};

const quiz = {
  title: "Solar system",
  description: "A short astronomy check",
  category: "Science",
  durationMinutes: 10,
  status: "published" as const,
  questions: [question],
};

describe("shared validation contracts", () => {
  it("normalizes email and accepts a strong registration", () => {
    const result = registerSchema.parse({ fullName: "Ada Lovelace", email: " ADA@EXAMPLE.COM ", password: "Analysis1", role: "teacher" });
    expect(result.email).toBe("ada@example.com");
  });

  it.each(["short", "onlyletters", "12345678"])("rejects an unsafe password: %s", (password) => {
    expect(registerSchema.safeParse({ fullName: "Ada Lovelace", email: "ada@example.com", password, role: "teacher" }).success).toBe(false);
  });

  it("rejects a correct answer outside the available options", () => {
    expect(questionSchema.safeParse({ ...question, correctIndex: 2 }).success).toBe(false);
  });

  it("rejects duplicate options regardless of case", () => {
    expect(questionSchema.safeParse({ ...question, options: ["Mars", " mars "] }).success).toBe(false);
  });

  it("rejects an empty quiz and invalid time limits", () => {
    expect(quizSchema.safeParse({ ...quiz, questions: [] }).success).toBe(false);
    expect(quizSchema.safeParse({ ...quiz, durationMinutes: 0 }).success).toBe(false);
  });
});
