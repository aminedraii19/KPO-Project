import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, CheckCircle2, Clock3, Menu, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/providers/auth";

const answers = ["Mars", "Jupiter", "Venus", "Mercury"];

function QuizPreview() {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <div className="relative mx-auto w-full max-w-lg rounded-[28px] border border-border bg-card p-5 shadow-2xl shadow-black/20 sm:p-7">
    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>SPACE EXPLORATION · 03/10</span><span className="flex items-center gap-1.5 text-highlight"><Clock3 className="size-4" />02:41</span></div>
    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full w-[30%] rounded-full bg-primary" /></div>
    <h2 className="mt-7 text-xl font-bold leading-snug sm:text-2xl">Which planet is known as the Red Planet?</h2>
    <div className="mt-6 space-y-2.5">{answers.map((answer, index) => {
      const correct = checked && index === 0;
      const wrong = checked && selected === index && index !== 0;
      return <button key={answer} onClick={() => { if (!checked) setSelected(index); }} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 text-left text-sm font-medium transition-all ${correct ? "border-emerald-400/50 bg-emerald-400/10" : wrong ? "border-red-400/50 bg-red-400/10" : selected === index ? "border-primary bg-primary/10" : "border-border/70 bg-background/50 hover:border-primary/50"}`}>
        <span className="grid size-7 place-items-center rounded-lg bg-secondary text-xs">{correct ? <Check className="size-4 text-emerald-300" /> : wrong ? <X className="size-4 text-red-300" /> : String.fromCharCode(65 + index)}</span>{answer}
      </button>;
    })}</div>
    <button className="btn-primary mt-6 w-full" disabled={selected === null || checked} onClick={() => setChecked(true)}>{checked ? selected === 0 ? "That’s correct" : "Correct answer: Mars" : "Check answer"}<ArrowRight className="size-4" /></button>
    <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">{checked ? "Instant feedback keeps learning moving." : "Try the live preview"}</p>
  </div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  return <div className="min-h-dvh overflow-hidden bg-background">
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation"><a className="text-sm font-medium text-muted-foreground hover:text-highlight" href="#how-it-works">How it works</a><a className="text-sm font-medium text-muted-foreground hover:text-highlight" href="#topics">Topics</a><a className="text-sm font-medium text-muted-foreground hover:text-highlight" href="#for-teachers">For teachers</a></nav>
        <div className="hidden items-center gap-3 md:flex">{user ? <Link className="btn-primary" to="/dashboard">Open dashboard<ArrowRight className="size-4" /></Link> : <><Link className="btn-secondary" to="/login">Sign in</Link><Link className="btn-primary" to="/register">Create account</Link></>}</div>
        <button className="icon-button md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <div className="border-t border-border bg-background p-4 md:hidden"><nav className="flex flex-col gap-1"><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-secondary" href="#how-it-works">How it works</a><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-secondary" href="#topics">Topics</a><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-secondary" href="#for-teachers">For teachers</a></nav><Link className="btn-primary mt-3 w-full" to={user ? "/dashboard" : "/register"}>{user ? "Open dashboard" : "Create account"}</Link></div>}
    </header>

    <main>
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div className="pointer-events-none absolute -left-40 top-20 -z-10 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-highlight"><Sparkles className="size-3.5" />Learning that feels alive</div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">Make every question <span className="text-gradient">count.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Create focused quizzes, bring your classroom together, and turn every answer into a clear next step.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link className="btn-primary" to={user ? "/dashboard" : "/register"}>Start learning free<ArrowRight className="size-4" /></Link><a className="btn-secondary" href="#how-it-works">See how it works</a></div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />Teacher and student workspaces</span><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />No credit card needed</span></div>
        </div>
        <QuizPreview />
      </section>

      <section id="how-it-works" className="border-y border-border/60 bg-sidebar/60"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-sm font-bold uppercase tracking-widest text-primary">One shared rhythm</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">From idea to insight,<br />without the busywork.</h2></div>
        <ol className="grid gap-6 sm:grid-cols-3">{[
          ["Build", "Write your own questions or import a fresh set from Open Trivia DB."],
          ["Bring everyone in", "Publish, schedule a session, and give students a clear place to start."],
          ["See what sticks", "Track scores and completions to understand where to focus next."],
        ].map(([title, text], index) => <li key={title} className="border-t-2 border-border pt-5"><span className="font-display text-sm font-bold text-highlight">0{index + 1}</span><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></li>)}</ol></div></div></section>

      <section id="topics" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-primary">A world of questions</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Curiosity has no syllabus.</h2></div><p className="max-w-md text-sm text-muted-foreground">Mix your own material with curated trivia across science, history, culture, and more.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Science", "History", "Mathematics", "General knowledge"].map((topic, index) => <Link to="/register" key={topic} className="group rounded-2xl border border-border bg-card/50 p-6 transition-transform hover:-translate-y-1 hover:border-primary/40"><span className="text-sm text-muted-foreground">0{index + 1}</span><h3 className="mt-8 text-xl font-bold">{topic}</h3><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-highlight">Explore topic<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div>
      </section>

      <section id="for-teachers" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"><div className="grid items-center gap-10 rounded-[28px] bg-highlight px-6 py-12 text-background sm:px-10 lg:grid-cols-[1fr_auto]"><div><h2 className="text-3xl font-extrabold sm:text-4xl">Your next great class starts with one question.</h2><p className="mt-3 max-w-2xl font-medium opacity-80">A focused workspace for teachers, a distraction-free experience for students.</p></div><Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-background px-6 font-bold text-foreground transition-transform hover:-translate-y-0.5">Create your first quiz<ArrowRight className="size-4" /></Link></div></section>
    </main>
    <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><Logo /><p>Thoughtful quizzes. Meaningful progress.</p><div className="flex gap-5"><a href="https://opentdb.com/" target="_blank" rel="noreferrer" className="hover:text-highlight">Open Trivia DB</a><Link to="/login" className="hover:text-highlight">Sign in</Link></div></div></footer>
  </div>;
}
