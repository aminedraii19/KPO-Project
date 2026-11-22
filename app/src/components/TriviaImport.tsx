import { useState } from "react";
import { useNavigate } from "react-router";
import { Download, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { errorMessage } from "@/lib/format";
import type { TriviaResult } from "@/types";

export function TriviaImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("");
  const [result, setResult] = useState<TriviaResult | null>(null);
  const utils = trpc.useUtils();
  const navigate = useNavigate();
  const fetcher = trpc.trivia.fetch.useMutation({ onSuccess: setResult, onError: (error) => toast.error(errorMessage(error)) });
  const create = trpc.quiz.createFromTrivia.useMutation({
    onSuccess: async ({ id }) => {
      await utils.quiz.list.invalidate();
      toast.success("Trivia quiz saved as a draft");
      onClose();
      navigate(`/quizzes/${id}/edit`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const load = () => { setResult(null); fetcher.mutate({ amount, ...(difficulty ? { difficulty } : {}) }); };
  const importQuiz = () => result && create.mutate({
    title: `Open Trivia · ${difficulty || "Mixed"} · ${new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}`,
    description: `${result.questions.length} multiple-choice questions imported from Open Trivia DB.`,
    category: "General knowledge",
    durationMinutes: Math.max(5, result.questions.length * 2),
    status: "draft",
    questions: result.questions,
  });
  return <Dialog open={open} onOpenChange={(value) => { if (!value) { setResult(null); onClose(); } }}><DialogContent className="max-h-[90dvh] overflow-y-auto border-border bg-card text-card-foreground sm:max-w-2xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="size-5 text-highlight" />Import from Open Trivia DB</DialogTitle><DialogDescription>Fetch a fresh question set. Responses are cached for six hours; cached questions remain available during an outage.</DialogDescription></DialogHeader>
    <div className="grid grid-cols-2 gap-3"><div><label className="form-label" htmlFor="trivia-amount">Questions</label><select id="trivia-amount" className="form-input" value={amount} onChange={(event) => setAmount(Number(event.target.value))}>{[3, 5, 10].map((value) => <option key={value}>{value}</option>)}</select></div><div><label className="form-label" htmlFor="trivia-difficulty">Difficulty</label><select id="trivia-difficulty" className="form-input" value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><option value="">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div></div>
    <button className="btn-secondary w-full" onClick={load} disabled={fetcher.isPending}>{fetcher.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{fetcher.isPending ? "Fetching questions…" : result ? "Fetch a new set" : "Preview questions"}</button>
    {result && <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">{result.questions.length} questions ready</p><span className="text-xs capitalize text-muted-foreground">Source: {result.cache === "stale" ? "offline cache" : result.cache}</span></div><ol className="max-h-72 space-y-3 overflow-y-auto pr-1">{result.questions.map((question, index) => <li key={`${question.prompt}-${index}`} className="rounded-xl bg-background/60 p-4 text-sm"><span className="mr-2 font-bold text-primary">{index + 1}.</span>{question.prompt}</li>)}</ol><button className="btn-primary mt-5 w-full" onClick={importQuiz} disabled={create.isPending}><Download className="size-4" />{create.isPending ? "Saving…" : "Save as editable draft"}</button></div>}
  </DialogContent></Dialog>;
}
