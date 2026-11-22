import { Link, useParams } from "react-router";
import { ArrowLeft, BookOpen, Clock3, Copy, Edit3, Play, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingScreen } from "@/components/Feedback";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/providers/auth";
import { errorMessage, formatDate } from "@/lib/format";

export default function QuizDetails() {
  const { id } = useParams();
  const quizId = Number(id);
  const { user } = useAuth();
  const quiz = trpc.quiz.get.useQuery(quizId);
  const attempts = trpc.quiz.attempts.useQuery(quizId, { enabled: user?.role === "teacher" });
  if (quiz.isLoading) return <LoadingScreen label="Loading quiz details" />;
  if (quiz.error) return <div className="page-wrap"><ErrorState message={errorMessage(quiz.error)} /></div>;
  const data = quiz.data!;
  const share = async () => { await navigator.clipboard.writeText(`${window.location.origin}/quizzes/${quizId}/play`); toast.success("Quiz link copied"); };
  return <div className="page-wrap">
    <Link to="/quizzes" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Quiz library</Link>
    <header className="surface p-6 sm:p-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-3"><StatusBadge status={data.status} /><span className="text-sm text-muted-foreground">{data.category}</span></div><h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{data.title}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{data.description || "No description provided."}</p><div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground"><span className="flex items-center gap-2"><BookOpen className="size-4 text-primary" />{data.questions.length} questions</span><span className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />{data.durationMinutes} minutes</span></div></div><div className="flex flex-wrap gap-2">{data.status === "published" && <><button className="btn-secondary" onClick={share}><Copy className="size-4" />Share</button><Link className="btn-primary" to={`/quizzes/${quizId}/play`}><Play className="size-4" />{user?.role === "teacher" ? "Preview" : "Start quiz"}</Link></>}{user?.role === "teacher" && <Link className="btn-secondary" to={`/quizzes/${quizId}/edit`}><Edit3 className="size-4" />Edit</Link>}</div></div></header>
    {user?.role === "teacher" && <section className="mt-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><TrendingUp className="size-5 text-primary" />Recent attempts</h2><div className="surface overflow-x-auto">{attempts.data?.length ? <table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-muted-foreground"><tr className="border-b border-border"><th className="p-4">Completed</th><th className="p-4">Score</th><th className="p-4">Correct</th><th className="p-4">Result</th></tr></thead><tbody className="divide-y divide-border/60">{attempts.data.map((attempt) => <tr key={attempt.id}><td className="p-4">{formatDate(attempt.completedAt)}</td><td className="p-4 font-semibold">{attempt.score}/{attempt.totalPoints}</td><td className="p-4">{attempt.correctCount}/{attempt.totalQuestions}</td><td className="p-4 text-highlight">{Math.round(attempt.score / attempt.totalPoints * 100)}%</td></tr>)}</tbody></table> : <EmptyState icon={TrendingUp} title="No attempts yet" description="Share the published quiz with students to start seeing results." />}</div></section>}
    <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Question overview</h2><div className="space-y-3">{data.questions.map((question, index) => <article key={question.id} className="surface p-5"><div className="flex gap-4"><span className="font-display font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold leading-relaxed">{question.prompt}</h3><p className="mt-2 text-sm text-muted-foreground">{question.options.length} options · {question.points} points · <span className="capitalize">{question.difficulty}</span></p>{"correctIndex" in question && <p className="mt-2 text-sm text-emerald-300">Correct: {question.options[question.correctIndex]}</p>}</div></div></article>)}</div></section>
  </div>;
}
