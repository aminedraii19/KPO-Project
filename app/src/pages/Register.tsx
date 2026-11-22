import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import { GraduationCap, Presentation } from "lucide-react";
import { registerSchema, type RegisterInput } from "@contracts/schemas";
import { AuthShell } from "@/components/AuthShell";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/providers/auth";
import { errorMessage } from "@/lib/format";

const inputClass = "min-h-12 w-full rounded-xl border border-[#ded9e1] bg-white px-4 text-base text-[#28242c] outline-none transition-colors placeholder:text-[#9a939f] focus:border-[#d85091]";

export default function Register() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { role: "student", groupName: "" } });
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const create = trpc.auth.register.useMutation({ onSuccess: async () => { await refresh(); navigate("/dashboard", { replace: true }); } });
  const role = watch("role");
  return <AuthShell title="Create your account" subtitle="Choose your role and make learning happen.">
    <form className="space-y-5" onSubmit={handleSubmit((data) => create.mutate(data))} noValidate>
      {create.error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{errorMessage(create.error)}</div>}
      <fieldset><legend className="mb-2 text-sm font-semibold">I am a…</legend><div className="grid grid-cols-2 gap-3">{([{ value: "student", label: "Student", icon: GraduationCap }, { value: "teacher", label: "Teacher", icon: Presentation }] as const).map(({ value, label, icon: Icon }) => <button type="button" key={value} onClick={() => setValue("role", value, { shouldValidate: true })} aria-pressed={role === value} className={`flex min-h-20 items-center gap-3 rounded-xl border px-4 text-left transition-colors ${role === value ? "border-[#d85091] bg-[#fff2f8]" : "border-[#ded9e1] bg-white hover:border-[#b8afbd]"}`}><Icon className={`size-5 ${role === value ? "text-[#bd3d7e]" : "text-[#6f6874]"}`} /><span className="font-bold">{label}</span></button>)}</div></fieldset>
      <div><label className="mb-2 block text-sm font-semibold" htmlFor="fullName">Full name</label><input id="fullName" autoComplete="name" className={inputClass} placeholder="Alex Morgan" {...register("fullName")} />{errors.fullName && <p className="mt-1.5 text-sm text-red-600">{errors.fullName.message}</p>}</div>
      <div><label className="mb-2 block text-sm font-semibold" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" {...register("email")} />{errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}</div>
      {role === "student" && <div><label className="mb-2 block text-sm font-semibold" htmlFor="groupName">Class or group <span className="font-normal text-[#6f6874]">(optional)</span></label><input id="groupName" className={inputClass} placeholder="e.g. 10A" {...register("groupName")} /></div>}
      <div><label className="mb-2 block text-sm font-semibold" htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" className={inputClass} placeholder="8+ characters, with a letter and number" {...register("password")} />{errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}</div>
      <button type="submit" className="min-h-12 w-full rounded-xl bg-[#28242c] px-5 font-bold text-white transition-colors hover:bg-[#46364e] disabled:opacity-50" disabled={create.isPending}>{create.isPending ? "Creating account…" : "Create account"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-[#6f6874]">Already registered? <Link className="font-bold text-[#bd3d7e] underline-offset-4 hover:underline" to="/login">Sign in</Link></p>
  </AuthShell>;
}
