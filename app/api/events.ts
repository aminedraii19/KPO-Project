import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { eventSchema, idSchema } from "@contracts/schemas";
import { events, quizzes } from "@db/schema";
import { z } from "zod";
import { authedQuery, createRouter, teacherQuery } from "./middleware";

export const eventRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const access = ctx.user.role === "teacher" ? eq(events.teacherId, ctx.user.id) : eq(quizzes.status, "published");
    return ctx.db.select({ event: events, quizTitle: quizzes.title })
      .from(events).innerJoin(quizzes, eq(quizzes.id, events.quizId))
      .where(access).orderBy(asc(events.startsAt)).limit(100);
  }),
  create: teacherQuery.input(eventSchema).mutation(async ({ ctx, input }) => {
    const [quiz] = await ctx.db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), eq(quizzes.teacherId, ctx.user.id))).limit(1);
    if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
    const [event] = await ctx.db.insert(events).values({
      quizId: input.quizId,
      startsAt: new Date(input.startsAt),
      visibility: input.visibility,
      teacherId: ctx.user.id,
    }).returning();
    return event!;
  }),
  update: teacherQuery.input(z.object({ id: idSchema, data: eventSchema })).mutation(async ({ ctx, input }) => {
    const [quiz] = await ctx.db.select().from(quizzes).where(and(eq(quizzes.id, input.data.quizId), eq(quizzes.teacherId, ctx.user.id))).limit(1);
    if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
    const [event] = await ctx.db.update(events).set({
      quizId: input.data.quizId,
      startsAt: new Date(input.data.startsAt),
      visibility: input.data.visibility,
    }).where(and(eq(events.id, input.id), eq(events.teacherId, ctx.user.id))).returning();
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    return event;
  }),
  remove: teacherQuery.input(idSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(events).where(and(eq(events.id, input), eq(events.teacherId, ctx.user.id)));
    return { ok: true };
  }),
});
