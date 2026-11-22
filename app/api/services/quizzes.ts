import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { AttemptInput, QuizInput, SafeUser } from "@contracts/schemas";
import { attempts, questions, quizzes } from "@db/schema";
import type { Database } from "../queries/connection";
import { gradeAttempt } from "./grader";

async function ownedQuiz(db: Database, id: number, user: SafeUser) {
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  if (!quiz || (user.role === "teacher" && quiz.teacherId !== user.id) || (user.role === "student" && quiz.status !== "published")) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
  }
  return quiz;
}

export async function listQuizzes(db: Database, user: SafeUser) {
  const access = user.role === "teacher" ? eq(quizzes.teacherId, user.id) : eq(quizzes.status, "published");
  const rows = await db.select().from(quizzes).where(access).orderBy(desc(quizzes.updatedAt)).limit(100);
  if (!rows.length) return [];

  const ids = rows.map((quiz) => quiz.id);
  const [questionRows, attemptRows] = await Promise.all([
    db.select({ quizId: questions.quizId }).from(questions).where(inArray(questions.quizId, ids)),
    db.select().from(attempts).where(inArray(attempts.quizId, ids)),
  ]);
  return rows.map((quiz) => {
    const results = attemptRows.filter((attempt) => attempt.quizId === quiz.id);
    return {
      ...quiz,
      questionCount: questionRows.filter((question) => question.quizId === quiz.id).length,
      attemptCount: results.length,
      averageScore: results.length
        ? Math.round(results.reduce((sum, attempt) => sum + (attempt.score / attempt.totalPoints) * 100, 0) / results.length)
        : 0,
    };
  });
}

export async function getQuiz(db: Database, id: number, user: SafeUser) {
  const quiz = await ownedQuiz(db, id, user);
  const items = await db.select().from(questions).where(eq(questions.quizId, id)).orderBy(asc(questions.position));
  const canSeeAnswers = user.role === "teacher" && quiz.teacherId === user.id;
  return {
    ...quiz,
    questions: items.map((question) => canSeeAnswers ? question : {
      id: question.id,
      quizId: question.quizId,
      position: question.position,
      prompt: question.prompt,
      options: question.options,
      points: question.points,
      difficulty: question.difficulty,
      explanation: null,
    }),
  };
}

export async function createQuiz(db: Database, input: QuizInput, user: SafeUser, source = "manual") {
  return db.transaction(async (tx) => {
    const [quiz] = await tx.insert(quizzes).values({
      title: input.title,
      description: input.description,
      category: input.category,
      durationMinutes: input.durationMinutes,
      status: input.status,
      teacherId: user.id,
      source,
    }).returning({ id: quizzes.id });
    if (!quiz) throw new Error("Quiz insert returned no row");
    await insertQuestions(tx, quiz.id, input.questions);
    return quiz;
  });
}

async function insertQuestions(db: Pick<Database, "insert">, quizId: number, items: QuizInput["questions"]) {
  await db.insert(questions).values(items.map((question, position) => ({ ...question, quizId, position })));
}

export async function updateQuiz(db: Database, id: number, input: QuizInput, user: SafeUser) {
  await ownedQuiz(db, id, user);
  return db.transaction(async (tx) => {
    await tx.update(quizzes).set({ ...input, updatedAt: new Date() }).where(eq(quizzes.id, id));
    await tx.delete(questions).where(eq(questions.quizId, id));
    await insertQuestions(tx, id, input.questions);
    return { id };
  });
}

export async function deleteQuiz(db: Database, id: number, user: SafeUser) {
  await ownedQuiz(db, id, user);
  await db.delete(quizzes).where(and(eq(quizzes.id, id), eq(quizzes.teacherId, user.id)));
  return { ok: true };
}

export async function submitAttempt(db: Database, quizId: number, input: AttemptInput, user: SafeUser) {
  const quiz = await ownedQuiz(db, quizId, user);
  const items = await db.select().from(questions).where(eq(questions.quizId, quizId));
  if (!items.length) throw new TRPCError({ code: "BAD_REQUEST", message: "This quiz has no questions" });
  const result = gradeAttempt(items, input.answers);
  const [attempt] = await db.insert(attempts).values({ ...result, quizId: quiz.id, userId: user.id }).returning();
  return attempt!;
}

export async function recentAttempts(db: Database, quizId: number, user: SafeUser) {
  await ownedQuiz(db, quizId, user);
  return db.select().from(attempts).where(eq(attempts.quizId, quizId)).orderBy(desc(attempts.completedAt)).limit(20);
}

export async function dashboard(db: Database, user: SafeUser) {
  const quizList = await listQuizzes(db, user);
  const ownAttempts = user.role === "student"
    ? await db.select().from(attempts).where(eq(attempts.userId, user.id)).orderBy(desc(attempts.completedAt)).limit(5)
    : [];
  return {
    stats: {
      quizzes: quizList.length,
      attempts: quizList.reduce((sum, quiz) => sum + quiz.attemptCount, 0),
      averageScore: quizList.length ? Math.round(quizList.reduce((sum, quiz) => sum + quiz.averageScore, 0) / quizList.length) : 0,
      published: quizList.filter((quiz) => quiz.status === "published").length,
    },
    recentQuizzes: quizList.slice(0, 4),
    recentAttempts: ownAttempts,
  };
}
