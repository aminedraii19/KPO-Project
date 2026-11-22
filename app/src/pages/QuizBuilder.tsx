import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { quizSchema, type QuizInput } from "@contracts/schemas";
import { ErrorState, LoadingScreen } from "@/components/Feedback";
import { trpc } from "@/providers/trpc";
import { errorMessage } from "@/lib/format";

const blankQuestion = { prompt: "", options: ["", "", "", ""], correctIndex: 0, points: 10, difficulty: "medium" as const, explanation: "" };
const defaults: QuizInput = { title: "", description: "", category: "Science", durationMinutes: 15, status: "draft", questions: [blankQuestion] };

export default function QuizBuilder() {
  const { id } = useParams();
  const quizId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const existing = trpc.quiz.get.useQuery(quizId!, { enabled: !!quizId });
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<QuizInput>({ resolver: zodResolver(quizSchema), defaultValues: defaults });
  const { fields, append, remove } = useFieldArray({ control, name: "questions" });
  const questionValues = watch("questions");
  const save = trpc.quiz.create.useMutation({ onSuccess: onSaved });
  const update = trpc.quiz.update.useMutation({ onSuccess: onSaved });

  useEffect(() => {
    if (existing.data) reset({
      title: existing.data.title,
      description: existing.data.description,
      category: existing.data.category,
      durationMinutes: existing.data.durationMinutes,
      status: existing.data.status,
      questions: existing.data.questions.map((question) => ({
        prompt: question.prompt,
        options: question.options,
        correctIndex: "correctIndex" in question ? question.correctIndex : 0,
        points: question.points,
        difficulty: question.difficulty,
        explanation: question.explanation ?? "",
      })),
    });
  }, [existing.data, reset]);

  function onSaved({ id: savedId }: { id: number }) {
    void utils.quiz.invalidate();
    toast.success(quizId ? "Quiz updated" : "Quiz created");
    navigate(`/quizzes/${savedId}`);
  }
  const pending = save.isPending || update.isPending;
  const onSubmit = handleSubmit((data) => quizId ? update.mutate({ id: quizId, data }) : save.mutate(data));
  if (quizId && existing.isLoading) return <LoadingScreen label="Opening quiz editor" />;
  if (existing.error) return <div className="page-wrap"><ErrorState message={errorMessage(existing.error)} /></div>;

  return <div className="page-wrap max-w-5xl">
    <Link to={quizId ? `/quizzes/${quizId}` : "/quizzes"} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to quiz</Link>
    <div className="mb-8"><h1 className="text-3xl font-extrabold sm:text-4xl">{quizId ? "Edit quiz" : "Build a new quiz"}</h1><p className="mt-2 text-muted-foreground">Write clear questions, mark one correct answer, then publish when you’re ready.</p></div>
    {(save.error || update.error) && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200" role="alert">{errorMessage(save.error || update.error)}</div>}
    <form onSubmit={onSubmit} noValidate>
      <section className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><label className="form-label" htmlFor="quiz-title">Quiz title</label><input id="quiz-title" className="form-input" placeholder="e.g. Introduction to Biology" {...register("title")} />{errors.title && <p className="mt-1 text-sm text-red-300">{errors.title.message}</p>}</div>
        <div className="sm:col-span-2"><label className="form-label" htmlFor="quiz-description">Description</label><textarea id="quiz-description" className="form-input min-h-24 resize-y" placeholder="What will learners practice?" {...register("description")} /></div>
        <div><label className="form-label" htmlFor="quiz-category">Category</label><input id="quiz-category" className="form-input" {...register("category")} />{errors.category && <p className="mt-1 text-sm text-red-300">{errors.category.message}</p>}</div>
        <div className="grid grid-cols-2 gap-4"><div><label className="form-label" htmlFor="quiz-duration">Minutes</label><input id="quiz-duration" type="number" min={1} max={180} className="form-input" {...register("durationMinutes", { valueAsNumber: true })} /></div><div><label className="form-label" htmlFor="quiz-status">Status</label><select id="quiz-status" className="form-input" {...register("status")}><option value="draft">Draft</option><option value="published">Published</option></select></div></div>
      </section>
      <div className="mb-4 mt-8 flex items-center justify-between"><h2 className="text-xl font-bold">Questions <span className="ml-1 text-sm font-normal text-muted-foreground">{fields.length}/50</span></h2><button type="button" className="btn-secondary" onClick={() => append({ ...blankQuestion, options: ["", "", "", ""] })}><Plus className="size-4" />Add question</button></div>
      {errors.questions?.message && <p className="mb-4 text-sm text-red-300">{errors.questions.message}</p>}
      <div className="space-y-5">{fields.map((field, index) => <section key={field.id} className="surface p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><span className="font-display text-sm font-bold text-primary">QUESTION {index + 1}</span><button type="button" className="icon-button hover:text-red-300" disabled={fields.length === 1} onClick={() => remove(index)} aria-label={`Remove question ${index + 1}`}><Trash2 className="size-4" /></button></div>
        <label className="form-label" htmlFor={`question-${index}`}>Prompt</label><textarea id={`question-${index}`} className="form-input min-h-24" placeholder="Write the question clearly" {...register(`questions.${index}.prompt`)} />{errors.questions?.[index]?.prompt && <p className="mt-1 text-sm text-red-300">{errors.questions[index].prompt?.message}</p>}
        <fieldset className="mt-5"><legend className="form-label">Options · select the correct answer</legend><div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3, 4, 5].slice(0, questionValues[index]?.options.length ?? 0).map((optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><input type="radio" name={`question-${index}-correct`} className="size-4 shrink-0 accent-[#ff7ab6]" aria-label={`Correct answer for option ${optionIndex + 1}`} value={optionIndex} checked={questionValues[index]?.correctIndex === optionIndex} onChange={() => setValue(`questions.${index}.correctIndex`, optionIndex, { shouldValidate: true })} /><input aria-label={`Question ${index + 1}, option ${optionIndex + 1}`} className="form-input" placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} {...register(`questions.${index}.options.${optionIndex}`)} /></div>)}</div>{(errors.questions?.[index]?.options || errors.questions?.[index]?.correctIndex) && <p className="mt-2 text-sm text-red-300">{errors.questions[index]?.options?.message || errors.questions[index]?.correctIndex?.message || "Check the answer options"}</p>}</fieldset>
        <div className="mt-5 grid gap-4 sm:grid-cols-3"><div><label className="form-label">Points</label><input aria-label={`Question ${index + 1} points`} type="number" className="form-input" {...register(`questions.${index}.points`, { valueAsNumber: true })} /></div><div><label className="form-label">Difficulty</label><select aria-label={`Question ${index + 1} difficulty`} className="form-input" {...register(`questions.${index}.difficulty`)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div><div><label className="form-label">Explanation <span className="font-normal text-muted-foreground">(optional)</span></label><input aria-label={`Question ${index + 1} explanation`} className="form-input" placeholder="Why is this correct?" {...register(`questions.${index}.explanation`)} /></div></div>
      </section>)}</div>
      <div className="sticky bottom-0 mt-6 flex justify-end border-t border-border bg-background/95 py-4 backdrop-blur"><button type="submit" className="btn-primary min-w-40" disabled={pending}><Save className="size-4" />{pending ? "Saving…" : quizId ? "Save changes" : "Create quiz"}</button></div>
    </form>
  </div>;
}
