import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Clock3, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { eventSchema, type EventInput } from "@contracts/schemas";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, ErrorState, LoadingScreen, PageHeader } from "@/components/Feedback";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/providers/auth";
import { errorMessage, formatDate } from "@/lib/format";
import type { EventItem } from "@/types";

function localInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function Events() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const events = trpc.event.list.useQuery();
  const quizzes = trpc.quiz.list.useQuery();
  const utils = trpc.useUtils();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventInput>({ resolver: zodResolver(eventSchema) });
  const saved = async () => { await utils.event.list.invalidate(); setFormOpen(false); toast.success(editing ? "Event updated" : "Event scheduled"); };
  const create = trpc.event.create.useMutation({ onSuccess: saved, onError: (error) => toast.error(errorMessage(error)) });
  const update = trpc.event.update.useMutation({ onSuccess: saved, onError: (error) => toast.error(errorMessage(error)) });
  const remove = trpc.event.remove.useMutation({ onSuccess: async () => { await utils.event.list.invalidate(); setDeleting(null); toast.success("Event deleted"); } });
  const openForm = (event?: EventItem) => {
    setEditing(event ?? null);
    reset(event ? { quizId: event.event.quizId, startsAt: localInput(new Date(event.event.startsAt)), visibility: event.event.visibility } : { quizId: 0, startsAt: localInput(new Date(Date.now() + 86_400_000)), visibility: "invited" });
    setFormOpen(true);
  };
  const visible = events.data?.filter(({ event, quizTitle }) => (filter === "all" || (filter === "upcoming") === (new Date(event.startsAt) > new Date())) && quizTitle.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-wrap">
    <PageHeader title="Quiz events" description="Give every quiz a clear time and place in the learning calendar." action={user?.role === "teacher" && <button className="btn-primary" onClick={() => openForm()}><Plus className="size-4" />Schedule event</button>} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="form-input pl-10" aria-label="Search events" placeholder="Search events" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="form-input sm:w-44" aria-label="Filter events" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All events</option></select></div>
    {events.isLoading ? <LoadingScreen label="Loading events" /> : events.error ? <ErrorState message={errorMessage(events.error)} retry={() => events.refetch()} /> : <div className="surface">{visible?.length ? <div className="divide-y divide-border/70">{visible.map((item) => { const past = new Date(item.event.startsAt) <= new Date(); return <article key={item.event.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-4"><CalendarDays className="mt-1 size-5 shrink-0 text-primary" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold">{item.quizTitle}</h2><span className={`rounded-full px-2 py-0.5 text-xs ${past ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>{past ? "Past" : "Upcoming"}</span></div><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="size-3.5" />{formatDate(item.event.startsAt)}</p><p className="mt-1 text-xs text-muted-foreground">{item.event.visibility === "all" ? "Visible to all students" : "Invited students only"}</p></div></div>{user?.role === "teacher" && <div className="flex gap-2"><button className="icon-button border border-border" onClick={() => openForm(item)} aria-label={`Edit ${item.quizTitle} event`}><Edit3 className="size-4" /></button><button className="icon-button border border-border hover:text-red-300" onClick={() => setDeleting(item.event.id)} aria-label={`Delete ${item.quizTitle} event`}><Trash2 className="size-4" /></button></div>}</article>; })}</div> : <EmptyState icon={CalendarDays} title="No events here" description={events.data?.length ? "Try another filter or search term." : "Schedule a quiz session to see it on the calendar."} action={user?.role === "teacher" ? <button className="btn-primary" onClick={() => openForm()}><Plus className="size-4" />Schedule event</button> : undefined} />}</div>}
    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="border-border bg-card text-card-foreground"><DialogHeader><DialogTitle>{editing ? "Edit event" : "Schedule an event"}</DialogTitle><DialogDescription>Select a quiz and choose when students should take it.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={handleSubmit((data) => editing ? update.mutate({ id: editing.event.id, data }) : create.mutate(data))} noValidate>
      <div><label className="form-label" htmlFor="event-quiz">Quiz</label><select id="event-quiz" className="form-input" {...register("quizId", { valueAsNumber: true })}><option value={0}>Select a quiz</option>{quizzes.data?.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select>{errors.quizId && <p className="mt-1 text-sm text-red-300">Select a valid quiz</p>}</div>
      <div><label className="form-label" htmlFor="event-date">Date and time</label><input id="event-date" type="datetime-local" className="form-input" {...register("startsAt")} />{errors.startsAt && <p className="mt-1 text-sm text-red-300">{errors.startsAt.message}</p>}</div>
      <div><label className="form-label" htmlFor="event-visibility">Audience</label><select id="event-visibility" className="form-input" {...register("visibility")}><option value="invited">Invited students only</option><option value="all">All students</option></select></div>
      <button type="submit" className="btn-primary w-full" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Saving…" : editing ? "Save changes" : "Schedule event"}</button>
    </form></DialogContent></Dialog>
    <ConfirmDialog open={deleting !== null} title="Delete this event?" description="The quiz remains in your library. Only this scheduled event will be removed." onClose={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting)} busy={remove.isPending} />
  </div>;
}
