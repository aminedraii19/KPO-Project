import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Trophy } from "lucide-react";
import { ErrorState, LoadingScreen } from "@/components/Feedback";
import { trpc } from "@/providers/trpc";
import { errorMessage } from "@/lib/format";
import type { AttemptInput } from "@contracts/schemas";
import type { QuizDetails } from "@/types";

type AnswerOverride = { questionId: number; selectedIndex: number | null };

export default function PlayQuiz() {
  const quizId = Number(useParams().id);
  const quiz = trpc.quiz.get.useQuery(quizId);
  if (quiz.isLoading || !quiz.data) return <LoadingScreen label="Preparing your quiz" />;
  if (quiz.error) return <div className="page-wrap"><ErrorState message={errorMessage(quiz.error)} /></div>;
  return <QuizSession key={quiz.data.id} quizId={quizId} data={quiz.data} />;
}

function QuizSession({ quizId, data }: { quizId: number; data: QuizDetails }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [secondsLeft, setSecondsLeft] = useState(data.durationMinutes * 60);
  const submit = trpc.quiz.submit.useMutation();
  const { mutate } = submit;

  const finish = useCallback((override?: AnswerOverride) => {
    if (submit.isPending || submit.isSuccess) return;
    const currentAnswers = override ? { ...answers, [override.questionId]: override.selectedIndex } : answers;
    const payload: AttemptInput = {
      answers: data.questions.map((item) => ({
        questionId: item.id,
        selectedIndex: currentAnswers[item.id] ?? null,
      })),
    };
    mutate({ quizId, data: payload });
  }, [answers, data.questions, mutate, quizId, submit.isPending, submit.isSuccess]);

  useEffect(() => {
    if (secondsLeft <= 0 || submit.isSuccess) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, submit.isSuccess]);

  useEffect(() => {
    if (secondsLeft === 0) finish();
  }, [finish, secondsLeft]);

  const question = data.questions[current]!;
  const result = submit.data;
  const answered = answers[question.id] !== undefined && answers[question.id] !== null;
  const next = () => current === data.questions.length - 1 ? finish() : setCurrent(current + 1);
  const skip = () => {
    const skipped = { questionId: question.id, selectedIndex: null };
    setAnswers({ ...answers, [question.id]: null });
    if (current === data.questions.length - 1) finish(skipped);
    else setCurrent(current + 1);
  };
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  if (result) return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="surface w-full max-w-xl p-8 text-center sm:p-10">
        <Trophy className="mx-auto size-14 text-highlight" />
        <p className="mt-5 text-sm font-bold uppercase tracking-widest text-primary">Quiz complete</p>
        <h1 className="mt-2 text-4xl font-extrabold">{Math.round(result.score / result.totalPoints * 100)}%</h1>
        <p className="mt-3 text-muted-foreground">{data.title}</p>
        <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
          <div className="bg-background p-4"><strong className="text-xl">{result.correctCount}</strong><span className="block text-xs text-muted-foreground">Correct</span></div>
          <div className="bg-background p-4"><strong className="text-xl">{result.score}</strong><span className="block text-xs text-muted-foreground">Points</span></div>
          <div className="bg-background p-4"><strong className="text-xl">{result.totalQuestions}</strong><span className="block text-xs text-muted-foreground">Questions</span></div>
        </div>
        <Link to="/quizzes" className="btn-primary mt-8 w-full">Back to library<ArrowRight className="size-4" /></Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <Link to={`/quizzes/${quizId}`} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Exit</Link>
          <span className="text-sm text-muted-foreground">{current + 1} of {data.questions.length}</span>
          <span className={`flex items-center gap-2 font-mono text-sm ${secondsLeft < 30 ? "text-red-300" : "text-highlight"}`}><Clock3 className="size-4" />{minutes}:{seconds}</span>
        </div>
        <div className="h-1 bg-secondary"><div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${(current + 1) / data.questions.length * 100}%` }} /></div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-5 flex items-center justify-between text-sm"><span className="font-semibold capitalize text-primary">{question.difficulty}</span><span className="text-muted-foreground">{question.points} points</span></div>
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{question.prompt}</h1>
        <fieldset className="mt-8">
          <legend className="sr-only">Choose one answer</legend>
          <div className="space-y-3">{question.options.map((option, index) => (
            <button key={index} type="button" onClick={() => setAnswers({ ...answers, [question.id]: index })} aria-pressed={answers[question.id] === index} className={`flex min-h-14 w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${answers[question.id] === index ? "border-primary bg-primary/10" : "border-border bg-card/45 hover:border-primary/50 hover:bg-card"}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${answers[question.id] === index ? "bg-primary text-background" : "bg-secondary text-muted-foreground"}`}>{String.fromCharCode(65 + index)}</span>
              <span className="font-medium">{option}</span>
            </button>
          ))}</div>
        </fieldset>
        {submit.error && <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-sm text-red-200" role="alert">{errorMessage(submit.error)}</p>}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button className="btn-secondary" onClick={skip}>Skip</button>
          <button className="btn-primary min-w-36" disabled={!answered || submit.isPending} onClick={next}>{submit.isPending ? "Submitting…" : current === data.questions.length - 1 ? "Finish quiz" : "Next question"}{!submit.isPending && <ArrowRight className="size-4" />}</button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="size-3.5" />Skipped questions receive zero points. Unanswered questions are submitted as skipped when time expires.</p>
      </div>
    </main>
  );
}
