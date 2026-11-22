import { and, desc, eq } from "drizzle-orm";
import { invitationSchema, idSchema } from "@contracts/schemas";
import { attempts, invitations, quizzes, users } from "@db/schema";
import { createRouter, teacherQuery } from "./middleware";

export const studentRouter = createRouter({
  list: teacherQuery.query(async ({ ctx }) => {
    const [students, pending, results] = await Promise.all([
      ctx.db.select({ id: users.id, fullName: users.fullName, email: users.email, groupName: users.groupName, createdAt: users.createdAt })
        .from(users).where(eq(users.role, "student")).orderBy(users.fullName),
      ctx.db.select().from(invitations).where(eq(invitations.teacherId, ctx.user.id)).orderBy(desc(invitations.createdAt)),
      ctx.db.select({ attempt: attempts }).from(attempts)
        .innerJoin(quizzes, eq(quizzes.id, attempts.quizId))
        .where(eq(quizzes.teacherId, ctx.user.id)),
    ]);
    return {
      students: students.map((student) => {
        const own = results.filter(({ attempt }) => attempt.userId === student.id).map(({ attempt }) => attempt);
        return { ...student, quizzesTaken: own.length, averageScore: own.length ? Math.round(own.reduce((sum, item) => sum + item.score / item.totalPoints * 100, 0) / own.length) : 0 };
      }),
      invitations: pending,
    };
  }),
  invite: teacherQuery.input(invitationSchema).mutation(async ({ ctx, input }) => {
    const [invitation] = await ctx.db.insert(invitations).values({ ...input, teacherId: ctx.user.id }).returning();
    return invitation!;
  }),
  removeInvitation: teacherQuery.input(idSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(invitations).where(and(eq(invitations.id, input), eq(invitations.teacherId, ctx.user.id)));
    return { ok: true };
  }),
});
