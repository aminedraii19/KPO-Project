import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { profileSchema } from "@contracts/schemas";
import { PageHeader } from "@/components/Feedback";
import { useAuth } from "@/providers/auth";
import { trpc } from "@/providers/trpc";
import { errorMessage, initials } from "@/lib/format";
import { z } from "zod";

type ProfileInput = z.infer<typeof profileSchema>;

export default function Settings() {
  const { user, refresh } = useAuth();
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), values: { fullName: user!.fullName, groupName: user!.groupName ?? "" } });
  const update = trpc.profile.update.useMutation({ onSuccess: () => { refresh(); toast.success("Profile updated"); }, onError: (error) => toast.error(errorMessage(error)) });
  return <div className="page-wrap max-w-4xl"><PageHeader title="Account settings" description="Keep your personal and classroom details up to date." />
    <section className="surface overflow-hidden"><div className="flex items-center gap-4 border-b border-border p-6"><span className="grid size-16 place-items-center rounded-full bg-primary/15 font-display text-xl font-bold text-primary">{initials(user!.fullName)}</span><div><h2 className="text-xl font-bold">{user!.fullName}</h2><p className="text-sm capitalize text-muted-foreground">{user!.role} account</p></div></div>
      <form className="grid gap-5 p-6 sm:grid-cols-2" onSubmit={handleSubmit((data) => update.mutate(data))} noValidate><div className="sm:col-span-2"><label className="form-label">Email</label><input className="form-input opacity-70" value={user!.email} disabled /><p className="mt-2 text-xs text-muted-foreground">Your sign-in email cannot be changed in this version.</p></div><div><label className="form-label">Full name</label><input className="form-input" {...register("fullName")} />{errors.fullName && <p className="mt-1 text-sm text-red-300">{errors.fullName.message}</p>}</div><div><label className="form-label">Class or group</label><input className="form-input" placeholder="Optional for teachers" {...register("groupName")} /></div><div className="sm:col-span-2"><button className="btn-primary" disabled={!isDirty || update.isPending}><Save className="size-4" />{update.isPending ? "Saving…" : "Save changes"}</button></div></form>
    </section>
  </div>;
}
