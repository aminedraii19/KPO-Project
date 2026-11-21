import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { loginSchema, registerSchema, type SafeUser } from "@contracts/schemas";
import { users } from "@db/schema";
import { createRouter, publicQuery } from "./middleware";
import { hashPassword, verifyPassword } from "./lib/password";
import { endSession, startSession } from "./lib/session";
import { rateLimit } from "./lib/rate-limit";

const safeUser = (user: typeof users.$inferSelect): SafeUser => ({
  id: user.id, fullName: user.fullName, email: user.email, role: user.role, groupName: user.groupName,
});

export const authRouter = createRouter({
  me: publicQuery.query(({ ctx }) => ctx.user ?? null),

  register: publicQuery.input(registerSchema).mutation(async ({ ctx, input }) => {
    rateLimit(ctx.req, "register");
    try {
      const [user] = await ctx.db.insert(users).values({
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        groupName: input.groupName,
        passwordHash: await hashPassword(input.password),
      }).returning();
      if (!user) throw new Error("User insert returned no row");
      await startSession(ctx.db, user.id, ctx.resHeaders);
      return safeUser(user);
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      }
      throw error;
    }
  }),

  login: publicQuery.input(loginSchema).mutation(async ({ ctx, input }) => {
    rateLimit(ctx.req, "login");
    const [user] = await ctx.db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }
    await startSession(ctx.db, user.id, ctx.resHeaders);
    return safeUser(user);
  }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    await endSession(ctx.db, ctx.req, ctx.resHeaders);
    return { ok: true };
  }),
});
