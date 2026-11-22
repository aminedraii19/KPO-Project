import { triviaQuerySchema } from "@contracts/schemas";
import { createRouter, teacherQuery } from "./middleware";
import { fetchTrivia } from "./services/trivia";

export const triviaRouter = createRouter({
  fetch: teacherQuery.input(triviaQuerySchema).mutation(({ ctx, input }) => fetchTrivia(ctx.db, input)),
});
