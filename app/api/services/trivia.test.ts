import { describe, expect, it } from "vitest";
import { questionSchema } from "@contracts/schemas";
import { mapTriviaResults } from "./trivia";

describe("Open Trivia DB mapping", () => {
  it("decodes HTML entities and preserves the correct answer after shuffling", () => {
    const [question] = mapTriviaResults([{
      question: "What does &quot;HTTP&quot; stand for?",
      correct_answer: "HyperText Transfer Protocol",
      incorrect_answers: ["HyperText Transfer Process", "High Transfer Protocol", "Home Text Transfer Protocol"],
      difficulty: "medium",
    }]);
    expect(question?.prompt).toBe('What does "HTTP" stand for?');
    expect(question?.options).toHaveLength(4);
    expect(question?.options[question.correctIndex]).toBe("HyperText Transfer Protocol");
    expect(questionSchema.parse(question)).toBeTruthy();
  });
});
