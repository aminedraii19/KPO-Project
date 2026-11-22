import { describe, expect, it } from "vitest";
import type { Question } from "@db/schema";
import { gradeAttempt } from "./grader";

function question(id: number, correctIndex = 0): Question {
  return {
    id, quizId: 1, position: id - 1, prompt: `Question ${id}`,
    options: ["Correct", "Incorrect", "Other"], correctIndex,
    points: 10, difficulty: "easy", explanation: null,
  };
}

const questions = [question(1), question(2, 1)];

describe("server-side quiz grading", () => {
  it("scores correct answers and explicit skips", () => {
    expect(gradeAttempt(questions, [
      { questionId: 1, selectedIndex: 0 },
      { questionId: 2, selectedIndex: null },
    ])).toEqual({ score: 10, totalPoints: 20, correctCount: 1, totalQuestions: 2 });
  });

  it("does not award points for a wrong answer", () => {
    const result = gradeAttempt([question(1)], [{ questionId: 1, selectedIndex: 1 }]);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
  });

  it("rejects missing answers instead of treating an incomplete payload as valid", () => {
    expect(() => gradeAttempt(questions, [{ questionId: 1, selectedIndex: 0 }])).toThrow("Answer every question");
  });

  it("rejects duplicate and unknown question IDs", () => {
    expect(() => gradeAttempt([question(1)], [
      { questionId: 1, selectedIndex: 0 }, { questionId: 1, selectedIndex: 1 },
    ])).toThrow("unknown or duplicate");
    expect(() => gradeAttempt([question(1)], [{ questionId: 99, selectedIndex: 0 }])).toThrow("unknown or duplicate");
  });

  it("rejects an option index outside the question", () => {
    expect(() => gradeAttempt([question(1)], [{ questionId: 1, selectedIndex: 3 }])).toThrow("out of range");
  });
});
