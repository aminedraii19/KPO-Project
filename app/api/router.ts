import { authRouter } from "./auth";
import { eventRouter } from "./events";
import { createRouter, publicQuery } from "./middleware";
import { profileRouter } from "./profile";
import { quizRouter } from "./quiz";
import { studentRouter } from "./students";
import { triviaRouter } from "./trivia";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  quiz: quizRouter,
  event: eventRouter,
  students: studentRouter,
  profile: profileRouter,
  trivia: triviaRouter,
});

export type AppRouter = typeof appRouter;
