import { attemptSchema, idSchema, quizSchema } from "@contracts/schemas";
import { z } from "zod";
import { authedQuery, createRouter, teacherQuery } from "./middleware";
import { createQuiz, dashboard, deleteQuiz, getQuiz, listQuizzes, recentAttempts, submitAttempt, updateQuiz } from "./services/quizzes";

export const quizRouter = createRouter({
  dashboard: authedQuery.query(({ ctx }) => dashboard(ctx.db, ctx.user)),
  list: authedQuery.query(({ ctx }) => listQuizzes(ctx.db, ctx.user)),
  get: authedQuery.input(idSchema).query(({ ctx, input }) => getQuiz(ctx.db, input, ctx.user)),
  attempts: teacherQuery.input(idSchema).query(({ ctx, input }) => recentAttempts(ctx.db, input, ctx.user)),
  create: teacherQuery.input(quizSchema).mutation(({ ctx, input }) => createQuiz(ctx.db, input, ctx.user)),
  createFromTrivia: teacherQuery.input(quizSchema).mutation(({ ctx, input }) => createQuiz(ctx.db, input, ctx.user, "opentdb")),
  update: teacherQuery.input(z.object({ id: idSchema, data: quizSchema })).mutation(({ ctx, input }) => updateQuiz(ctx.db, input.id, input.data, ctx.user)),
  remove: teacherQuery.input(idSchema).mutation(({ ctx, input }) => deleteQuiz(ctx.db, input, ctx.user)),
  submit: authedQuery.input(z.object({ quizId: idSchema, data: attemptSchema })).mutation(({ ctx, input }) => submitAttempt(ctx.db, input.quizId, input.data, ctx.user)),
});
