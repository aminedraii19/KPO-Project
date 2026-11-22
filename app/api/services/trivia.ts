import he from "he";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { QuestionInput } from "@contracts/schemas";
import { externalCache } from "@db/schema";
import type { Database } from "../queries/connection";
import { CircuitBreaker } from "./circuit-breaker";

const { decode } = he;

const responseSchema = z.object({
  response_code: z.number(),
  results: z.array(z.object({
    question: z.string(),
    correct_answer: z.string(),
    incorrect_answers: z.array(z.string()),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })),
});

export type TriviaResult = { questions: QuestionInput[]; cache: "network" | "hit" | "stale" };
const breaker = new CircuitBreaker();
const TTL_MS = 6 * 60 * 60 * 1000;

export function mapTriviaResults(results: z.infer<typeof responseSchema>["results"]): QuestionInput[] {
  return results.map((item) => {
    const correct = decode(item.correct_answer);
    const options = [correct, ...item.incorrect_answers.map((answer) => decode(answer))].sort(() => Math.random() - 0.5);
    return {
      prompt: decode(item.question),
      options,
      correctIndex: options.indexOf(correct),
      points: 10,
      difficulty: item.difficulty,
      explanation: `Correct answer: ${correct}`,
    };
  });
}

export async function fetchTrivia(
  db: Database,
  input: { amount: number; difficulty?: "easy" | "medium" | "hard" },
  fetcher: typeof fetch = fetch,
): Promise<TriviaResult> {
  const key = `trivia:${input.amount}:${input.difficulty ?? "any"}`;
  const [cached] = await db.select().from(externalCache).where(eq(externalCache.key, key)).limit(1);
  if (cached && cached.expiresAt > new Date()) return { questions: cached.value as QuestionInput[], cache: "hit" };

  try {
    const questions = await breaker.run(async () => {
      const params = new URLSearchParams({ amount: String(input.amount), type: "multiple" });
      if (input.difficulty) params.set("difficulty", input.difficulty);
      const response = await fetcher(`https://opentdb.com/api.php?${params}`, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error(`Open Trivia DB returned ${response.status}`);
      const payload = responseSchema.parse(await response.json());
      if (payload.response_code !== 0) throw new Error("No questions match these filters");
      return mapTriviaResults(payload.results);
    });
    await db.insert(externalCache).values({ key, value: questions, expiresAt: new Date(Date.now() + TTL_MS) })
      .onConflictDoUpdate({ target: externalCache.key, set: { value: questions, expiresAt: new Date(Date.now() + TTL_MS), updatedAt: new Date() } });
    return { questions, cache: "network" };
  } catch (error) {
    if (cached) return { questions: cached.value as QuestionInput[], cache: "stale" };
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Question service unavailable" });
  }
}
