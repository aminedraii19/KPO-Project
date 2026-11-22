import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../api/router";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type QuizSummary = RouterOutputs["quiz"]["list"][number];
export type QuizDetails = RouterOutputs["quiz"]["get"];
export type TriviaResult = RouterOutputs["trivia"]["fetch"];
export type EventItem = RouterOutputs["event"]["list"][number];
