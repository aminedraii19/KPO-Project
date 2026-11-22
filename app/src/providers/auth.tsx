import { createContext, useContext, type ReactNode } from "react";
import type { SafeUser } from "@contracts/schemas";
import { trpc } from "./trpc";

type AuthValue = { user: SafeUser | null; isLoading: boolean; refresh: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = trpc.auth.me.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const utils = trpc.useUtils();
  return <AuthContext.Provider value={{ user: query.data ?? null, isLoading: query.isLoading, refresh: async () => { await utils.auth.me.invalidate(); } }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
