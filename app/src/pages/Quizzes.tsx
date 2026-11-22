import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Clock3, Download, Edit3, Play, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, ErrorState, LoadingScreen, PageHeader } from "@/components/Feedback";
import { StatusBadge } from "@/components/StatusBadge";
import { TriviaImport } from "@/components/TriviaImport";
import { useAuth } from "@/providers/auth";
import { trpc } from "@/providers/trpc";
import { errorMessage } from "@/lib/format";
import type { QuizSummary } from "@/types";

export default function Quizzes() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);
  const query = trpc.quiz.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.quiz.remove.useMutation({ onSuccess: async () => { await utils.quiz.list.invalidate(); setDeleting(null); toast.success("Quiz deleted"); }, onError: (error) => toast.error(errorMessage(error)) });
  const categories = useMemo(() => [...new Set(query.data?.map((quiz) => quiz.category))], [query.data]);
  const filtered = query.data?.filter((quiz) => (status === "all" || quiz.status === status) && (category === "all" || quiz.category === category) && `${quiz.title} ${quiz.description}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-wrap">
    <PageHeader title="Quiz library" description={user!.role === "teacher" ? "Create, import, and manage every quiz from one focused workspace." : "Choose a published quiz and test what you know."} action={user!.role === "teacher" && <div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => setImportOpen(true)}><Download className="size-4" />Import trivia</button><Link className="btn-primary" to="/quizzes/new"><Plus className="size-4" />New quiz</Link></div>} />
    <div className="mb-5 flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search quizzes" className="form-input pl-10" placeholder="Search by title or description" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="grid grid-cols-2 gap-3 sm:flex"><select aria-label="Filter by status" className="form-input sm:w-40" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></select><select aria-label="Filter by category" className="form-input sm:w-48" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div>
    {query.isLoading ? <LoadingScreen label="Loading quizzes" /> : query.error ? <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} /> : <div className="surface overflow-hidden">{filtered?.length ? <div className="divide-y divide-border/70">{filtered.map((quiz) => <article key={quiz.id} className="p-4 transition-colors hover:bg-secondary/30 sm:p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link to={`/quizzes/${quiz.id}`} className="truncate font-display text-lg font-bold hover:text-highlight">{quiz.title}</Link><StatusBadge status={quiz.status} />{quiz.source === "opentdb" && <span className="text-xs text-muted-foreground">Open Trivia DB</span>}</div><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{quiz.description || "No description"}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><BookOpen className="size-3.5" />{quiz.questionCount} questions</span><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{quiz.durationMinutes} min</span><span>{quiz.category}</span><span>{quiz.attemptCount} attempts</span></div></div><div className="flex flex-wrap items-center gap-2">{quiz.status === "published" && <Link className="btn-secondary" to={`/quizzes/${quiz.id}/play`}><Play className="size-4" />Play</Link>}<Link className="btn-secondary" to={`/quizzes/${quiz.id}`}>Details</Link>{user!.role === "teacher" && <><Link aria-label={`Edit ${quiz.title}`} className="icon-button border border-border" to={`/quizzes/${quiz.id}/edit`}><Edit3 className="size-4" /></Link><button aria-label={`Delete ${quiz.title}`} className="icon-button border border-border hover:text-red-300" onClick={() => setDeleting(quiz)}><Trash2 className="size-4" /></button></>}</div></div></article>)}</div> : <EmptyState icon={BookOpen} title={query.data?.length ? "No quizzes match" : "Your library is ready"} description={query.data?.length ? "Try a different search or clear the filters." : user!.role === "teacher" ? "Create a quiz from scratch or import a question set to begin." : "No published quizzes are available yet."} action={!query.data?.length && user!.role === "teacher" ? <Link className="btn-primary" to="/quizzes/new"><Plus className="size-4" />Create quiz</Link> : undefined} />}</div>}
    {user!.role === "teacher" && <TriviaImport open={importOpen} onClose={() => setImportOpen(false)} />}
    <ConfirmDialog open={!!deleting} title={`Delete “${deleting?.title}”?`} description="This permanently removes the quiz, its questions, events, and attempts. This action cannot be undone." onClose={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)} busy={remove.isPending} />
  </div>;
}
