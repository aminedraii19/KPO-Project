import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { sessions, users } from "@db/schema";
import type { Database } from "../queries/connection";
import { env } from "./env";

const COOKIE_NAME = "quizzy_session";
const WEEK_SECONDS = 60 * 60 * 24 * 7;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function cookie(token: string, maxAge: number) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${env.isProduction ? "; Secure" : ""}`;
}

export async function startSession(db: Database, userId: number, headers: Headers) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + WEEK_SECONDS * 1000),
  });
  headers.append("Set-Cookie", cookie(token, WEEK_SECONDS));
}

export async function endSession(db: Database, req: Request, headers: Headers) {
  const token = req.headers.get("cookie")?.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`))?.[1];
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  headers.append("Set-Cookie", cookie("", 0));
}

export async function sessionUser(db: Database, req: Request) {
  const token = req.headers.get("cookie")?.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`))?.[1];
  if (!token) return undefined;
  const [result] = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, groupName: users.groupName })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return result;
}
