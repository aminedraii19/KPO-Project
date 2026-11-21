import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { log } from "./lib/logger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      log.error("trpc procedure failed", { path: shape.data?.path, error: error.message, stack: error.stack });
    }
    return shape;
  },
});

export const createRouter = t.router;
export const publicQuery = t.procedure;
export const authedQuery = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const teacherQuery = authedQuery.use(({ ctx, next }) => {
  if (ctx.user.role !== "teacher") throw new TRPCError({ code: "FORBIDDEN", message: "Teacher access required" });
  return next();
});
