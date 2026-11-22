import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../../api/router";

export function errorMessage(error: unknown) {
  if (error instanceof TRPCClientError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export type ClientError = TRPCClientError<AppRouter>;
