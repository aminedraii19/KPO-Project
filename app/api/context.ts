import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { SafeUser } from "@contracts/schemas";
import { getDb, type Database } from "./queries/connection";
import { sessionUser } from "./lib/session";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  db: Database;
  user?: SafeUser;
};

export async function createContext(opts: FetchCreateContextFnOptions): Promise<TrpcContext> {
  const db = getDb();
  return { req: opts.req, resHeaders: opts.resHeaders, db, user: await sessionUser(db, opts.req) };
}
