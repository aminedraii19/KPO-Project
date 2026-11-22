import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router";
import { loginSchema, type LoginInput } from "@contracts/schemas";
import { AuthShell } from "@/components/AuthShell";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/providers/auth";
import { errorMessage } from "@/lib/format";

const inputClass = "min-h-12 w-full rounded-xl border border-[#ded9e1] bg-white px-4 text-base text-[#28242c] outline-none transition-colors placeholder:text-[#9a939f] focus:border-[#d85091]";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const login = trpc.auth.login.useMutation({ onSuccess: async () => { await refresh(); navigate(location.state?.from ?? "/dashboard", { replace: true }); } });
  return <AuthShell title="Welcome back" subtitle="Pick up right where you left off.">
    <form className="space-y-5" onSubmit={handleSubmit((data) => login.mutate(data))} noValidate>
      {login.error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{errorMessage(login.error)}</div>}
      <div><label className="mb-2 block text-sm font-semibold" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} aria-invalid={!!errors.email} {...register("email")} />{errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}</div>
      <div><label className="mb-2 block text-sm font-semibold" htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" placeholder="Your password" className={inputClass} aria-invalid={!!errors.password} {...register("password")} />{errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}</div>
      <button type="submit" className="min-h-12 w-full rounded-xl bg-[#28242c] px-5 font-bold text-white transition-colors hover:bg-[#46364e] disabled:opacity-50" disabled={login.isPending}>{login.isPending ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-[#6f6874]">New to Quizzy? <Link className="font-bold text-[#bd3d7e] underline-offset-4 hover:underline" to="/register">Create an account</Link></p>
  </AuthShell>;
}
