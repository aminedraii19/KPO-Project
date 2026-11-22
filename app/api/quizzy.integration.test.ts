import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import type { SafeUser } from "@contracts/schemas";
import { attempts, events, externalCache, invitations, questions, quizzes, sessions, users } from "@db/schema";
import { appRouter } from "./router";
import { createDatabase } from "./queries/connection";
import { fetchTrivia } from "./services/trivia";

const configuredUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const databaseUrl = configuredUrl && new URL(configuredUrl).pathname.endsWith("_test")
  ? configuredUrl
  : "postgresql://quizzy:quizzy@localhost:5432/quizzy_test";
if (!new URL(databaseUrl).pathname.endsWith("_test")) throw new Error("Integration tests require an isolated *_test database");
const db = createDatabase(databaseUrl);
const caller = (user?: SafeUser) => appRouter.createCaller({
  db, user, req: new Request("http://localhost", { headers: { "x-forwarded-for": "integration-test" } }), resHeaders: new Headers(),
});

const quizInput = {
  title: "Cell biology", description: "Check the essentials", category: "Science", durationMinutes: 10, status: "published" as const,
  questions: [
    { prompt: "Which organelle produces most cellular ATP?", options: ["Mitochondrion", "Nucleus"], correctIndex: 0, points: 10, difficulty: "easy" as const },
    { prompt: "Which molecule stores hereditary information?", options: ["ATP", "DNA"], correctIndex: 1, points: 10, difficulty: "easy" as const },
  ],
};

async function register(role: "teacher" | "student", suffix: string) {
  return caller().auth.register({ fullName: `${role} ${suffix}`, email: `${role}-${suffix}@example.com`, password: "Password1", role, groupName: role === "student" ? "10A" : undefined });
}

describe("Quizzy PostgreSQL integration", () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, "../db/migrations") });
  });

  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(attempts);
    await db.delete(events);
    await db.delete(questions);
    await db.delete(quizzes);
    await db.delete(invitations);
    await db.delete(externalCache);
    await db.delete(users);
  });

  afterAll(() => db.$client.end());

  it("completes the teacher-to-student user story with server-side grading", async () => {
    const teacher = await register("teacher", "story");
    const { id: quizId } = await caller(teacher).quiz.create(quizInput);
    const student = await register("student", "story");

    const visible = await caller(student).quiz.list();
    expect(visible.map((quiz) => quiz.id)).toContain(quizId);
    const playable = await caller(student).quiz.get(quizId);
    expect(playable.questions[0]).not.toHaveProperty("correctIndex");

    const result = await caller(student).quiz.submit({ quizId, data: { answers: [
      { questionId: playable.questions[0]!.id, selectedIndex: 0 },
      { questionId: playable.questions[1]!.id, selectedIndex: null },
    ] } });
    expect(result).toMatchObject({ score: 10, totalPoints: 20, correctCount: 1, totalQuestions: 2, userId: student.id });

    const persisted = await caller(teacher).quiz.attempts(quizId);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.id).toBe(result.id);
  });

  it("enforces roles, teacher ownership, and per-teacher score aggregation", async () => {
    const teacherA = await register("teacher", "a");
    const teacherB = await register("teacher", "b");
    const student = await register("student", "shared");
    const { id: quizA } = await caller(teacherA).quiz.create(quizInput);
    const { id: quizB } = await caller(teacherB).quiz.create({ ...quizInput, title: "Second teacher quiz" });

    await expect(caller(student).quiz.create(quizInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(teacherB).quiz.get(quizA)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller(teacherB).event.create({ quizId: quizA, startsAt: new Date(Date.now() + 86_400_000).toISOString(), visibility: "all" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    const questionsA = (await caller(student).quiz.get(quizA)).questions;
    const questionsB = (await caller(student).quiz.get(quizB)).questions;
    await caller(student).quiz.submit({ quizId: quizA, data: { answers: questionsA.map((question) => ({ questionId: question.id, selectedIndex: question.prompt.includes("ATP") ? 0 : 1 })) } });
    await caller(student).quiz.submit({ quizId: quizB, data: { answers: questionsB.map((question) => ({ questionId: question.id, selectedIndex: null })) } });

    const directory = await caller(teacherA).students.list();
    expect(directory.students.find((item) => item.id === student.id)).toMatchObject({ quizzesTaken: 1, averageScore: 100 });
  });

  it("caches external questions and serves stale data during an outage", async () => {
    const payload = { response_code: 0, results: [{
      question: "What is &quot;HTML&quot;?", correct_answer: "A markup language",
      incorrect_answers: ["A database", "A protocol", "An operating system"], difficulty: "easy",
    }] };
    const online = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(payload)));
    const input = { amount: 1, difficulty: "easy" as const };

    const network = await fetchTrivia(db, input, online);
    expect(network.cache).toBe("network");
    expect(network.questions[0]?.prompt).toBe('What is "HTML"?');
    expect((await fetchTrivia(db, input, online)).cache).toBe("hit");
    expect(online).toHaveBeenCalledTimes(1);

    await db.update(externalCache).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(externalCache.key, "trivia:1:easy"));
    const stale = await fetchTrivia(db, input, vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")));
    expect(stale.cache).toBe("stale");
    expect(stale.questions).toEqual(network.questions);
  });
});
