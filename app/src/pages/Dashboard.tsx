import { Link } from "react-router";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Plus, TrendingUp } from "lucide-react";
import { ErrorState, LoadingScreen, PageHeader } from "@/components/Feedback";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/providers/auth";
import { trpc } from "@/providers/trpc";
import { errorMessage, formatDate } from "@/lib/format";

export default function Dashboard() {
  const { user } = useAuth();
  const dashboard = trpc.quiz.dashboard.useQuery();
  const events = trpc.event.list.useQuery();
  if (dashboard.isLoading) return <LoadingScreen />;
  if (dashboard.error) return <div className="page-wrap"><ErrorState message={errorMessage(dashboard.error)} retry={() => dashboard.refetch()} /></div>;
  const data = dashboard.data!;
  const firstName = user!.fullName.split(" ")[0];
  const stats = [
    { label: user!.role === "teacher" ? "Your quizzes" : "Available quizzes", value: data.stats.quizzes, icon: BookOpen },
    { label: user!.role === "teacher" ? "Total attempts" : "Published quizzes", value: user!.role === "teacher" ? data.stats.attempts : data.stats.published, icon: CheckCircle2 },
    { label: "Average score", value: `${data.stats.averageScore}%`, icon: TrendingUp },
  ];
  return <div className="page-wrap">
    <PageHeader title={`Good to see you, ${firstName}.`} description={user!.role === "teacher" ? "Here’s the latest activity across your learning space." : "Your next challenge is waiting. Keep the momentum going."} action={user!.role === "teacher" ? <Link to="/quizzes/new" className="btn-primary"><Plus className="size-4" />Create quiz</Link> : <Link to="/quizzes" className="btn-primary">Browse quizzes<ArrowRight className="size-4" /></Link>} />
    <section className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3" aria-label="Workspace statistics">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="bg-card p-6"><Icon className="size-5 text-primary" /><p className="mt-5 font-display text-3xl font-extrabold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</section>
    <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_0.8fr]">
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Recent quizzes</h2><Link className="text-sm font-semibold text-highlight hover:underline" to="/quizzes">View all</Link></div>
        <div className="surface divide-y divide-border/70">{data.recentQuizzes.length ? data.recentQuizzes.map((quiz) => <Link to={`/quizzes/${quiz.id}`} key={quiz.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40 sm:p-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold">{quiz.title}</h3><StatusBadge status={quiz.status} /></div><p className="mt-1 text-sm text-muted-foreground">{quiz.questionCount} questions · {quiz.attemptCount} attempts</p></div><span className="text-right"><strong className="font-display text-xl">{quiz.averageScore}%</strong><span className="block text-xs text-muted-foreground">avg. score</span></span></Link>) : <div className="p-8 text-center text-sm text-muted-foreground">No quizzes yet. Create one to get started.</div>}</div>
      </section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Coming up</h2><CalendarDays className="size-5 text-primary" /></div><div className="surface divide-y divide-border/70">{events.data?.length ? events.data.slice(0, 4).map(({ event, quizTitle }) => <Link to="/events" key={event.id} className="block p-5 hover:bg-secondary/40"><p className="text-sm font-semibold text-highlight">{formatDate(event.startsAt)}</p><h3 className="mt-1 font-bold">{quizTitle}</h3><p className="mt-1 text-xs capitalize text-muted-foreground">{event.visibility === "all" ? "All students" : "Invited students"}</p></Link>) : <div className="p-6 text-sm text-muted-foreground">No events scheduled. {user!.role === "teacher" && <Link className="mt-3 inline-block font-semibold text-highlight" to="/events">Schedule a session →</Link>}</div>}</div></section>
    </div>
  </div>;
}
