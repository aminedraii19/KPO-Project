import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router";
import { Mail, Search, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { invitationSchema } from "@contracts/schemas";
import { EmptyState, ErrorState, LoadingScreen, PageHeader } from "@/components/Feedback";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/providers/auth";
import { errorMessage, initials } from "@/lib/format";
import { z } from "zod";

type InvitationInput = z.infer<typeof invitationSchema>;

export default function Students() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [open, setOpen] = useState(false);
  const query = trpc.students.list.useQuery(undefined, { enabled: user?.role === "teacher" });
  const utils = trpc.useUtils();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvitationInput>({ resolver: zodResolver(invitationSchema), defaultValues: { groupName: "10A" } });
  const invite = trpc.students.invite.useMutation({ onSuccess: async () => { await utils.students.list.invalidate(); setOpen(false); reset(); toast.success("Invitation saved. Share the registration link with the student."); }, onError: (error) => toast.error(errorMessage(error)) });
  const remove = trpc.students.removeInvitation.useMutation({ onSuccess: async () => { await utils.students.list.invalidate(); toast.success("Invitation removed"); } });
  if (user?.role !== "teacher") return <Navigate to="/dashboard" replace />;
  const groups = [...new Set([...(query.data?.students.map((student) => student.groupName) ?? []), ...(query.data?.invitations.map((item) => item.groupName) ?? [])].filter(Boolean))] as string[];
  const students = query.data?.students.filter((student) => (!search || `${student.fullName} ${student.email}`.toLowerCase().includes(search.toLowerCase())) && (group === "all" || student.groupName === group));
  const invitations = query.data?.invitations.filter((item) => (!search || `${item.fullName} ${item.email}`.toLowerCase().includes(search.toLowerCase())) && (group === "all" || item.groupName === group));
  return <div className="page-wrap">
    <PageHeader title="Students" description="Follow registered students and keep track of pending invitations." action={<button className="btn-primary" onClick={() => setOpen(true)}><UserPlus className="size-4" />Add invitation</button>} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="form-input pl-10" aria-label="Search students" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="form-input sm:w-44" aria-label="Filter by group" value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All groups</option>{groups.map((item) => <option key={item}>{item}</option>)}</select></div>
    {query.isLoading ? <LoadingScreen label="Loading student directory" /> : query.error ? <ErrorState message={errorMessage(query.error)} /> : <div className="surface overflow-hidden"><div className="hidden grid-cols-[1.5fr_0.6fr_0.7fr_0.6fr] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>Student</span><span>Group</span><span>Quizzes</span><span>Avg. score</span></div>{students?.length || invitations?.length ? <div className="divide-y divide-border/70">{students?.map((student) => <article key={student.id} className="grid gap-3 p-5 md:grid-cols-[1.5fr_0.6fr_0.7fr_0.6fr] md:items-center md:gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(student.fullName)}</span><div className="min-w-0"><h2 className="truncate font-semibold">{student.fullName}</h2><p className="truncate text-sm text-muted-foreground">{student.email}</p></div></div><span className="text-sm text-muted-foreground">{student.groupName || "No group"}</span><span className="text-sm">{student.quizzesTaken}</span><strong className="text-highlight">{student.averageScore}%</strong></article>)}{invitations?.map((item) => <article key={item.id} className="grid gap-3 p-5 md:grid-cols-[1.5fr_0.6fr_0.7fr_0.6fr] md:items-center md:gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><Mail className="size-4" /></span><div className="min-w-0"><h2 className="truncate font-semibold">{item.fullName} <span className="ml-1 text-xs font-normal text-accent">Pending</span></h2><p className="truncate text-sm text-muted-foreground">{item.email}</p></div></div><span className="text-sm text-muted-foreground">{item.groupName}</span><span className="text-sm text-muted-foreground">Not registered</span><button className="icon-button justify-self-start hover:text-red-300 md:justify-self-end" onClick={() => remove.mutate(item.id)} aria-label={`Remove invitation for ${item.fullName}`}><Trash2 className="size-4" /></button></article>)}</div> : <EmptyState icon={Users} title="No students found" description={query.data?.students.length || query.data?.invitations.length ? "Try another search or group filter." : "Add an invitation to start building your class directory."} />}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="border-border bg-card text-card-foreground"><DialogHeader><DialogTitle>Add a student invitation</DialogTitle><DialogDescription>Quizzy records the invitation. Email delivery is not configured, so share the registration link yourself.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={handleSubmit((data) => invite.mutate(data))} noValidate><div><label className="form-label">Full name</label><input className="form-input" {...register("fullName")} />{errors.fullName && <p className="mt-1 text-sm text-red-300">{errors.fullName.message}</p>}</div><div><label className="form-label">Email</label><input className="form-input" type="email" {...register("email")} />{errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}</div><div><label className="form-label">Class or group</label><input className="form-input" {...register("groupName")} />{errors.groupName && <p className="mt-1 text-sm text-red-300">{errors.groupName.message}</p>}</div><button className="btn-primary w-full" disabled={invite.isPending}>{invite.isPending ? "Saving…" : "Save invitation"}</button></form></DialogContent></Dialog>
  </div>;
}
