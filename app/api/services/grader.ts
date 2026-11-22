import { TRPCError } from "@trpc/server";
import type { AttemptInput } from "@contracts/schemas";
import type { Question } from "@db/schema";

export function gradeAttempt(questions: Question[], answers: AttemptInput["answers"]) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set<number>();

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question || seen.has(answer.questionId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Answers contain unknown or duplicate questions" });
    }
    if (answer.selectedIndex !== null && answer.selectedIndex >= question.options.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Answer option is out of range" });
    }
    seen.add(answer.questionId);
  }
  if (seen.size !== questions.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Answer every question or explicitly skip it" });
  }

  return answers.reduce((result, answer) => {
    const question = byId.get(answer.questionId)!;
    const correct = answer.selectedIndex === question.correctIndex;
    return {
      score: result.score + (correct ? question.points : 0),
      totalPoints: result.totalPoints + question.points,
      correctCount: result.correctCount + Number(correct),
      totalQuestions: questions.length,
    };
  }, { score: 0, totalPoints: 0, correctCount: 0, totalQuestions: questions.length });
}
