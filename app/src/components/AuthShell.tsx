import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="grid min-h-dvh bg-background lg:grid-cols-2">
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
      <div className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full bg-primary/10 blur-3xl" />
      <Logo />
      <div className="relative max-w-lg"><p className="text-sm font-bold uppercase tracking-widest text-highlight">Learn together</p><blockquote className="mt-5 font-display text-4xl font-extrabold leading-tight">Good questions open doors. Clear feedback shows the way.</blockquote><div className="mt-8 space-y-3 text-sm text-muted-foreground">{["Build quizzes your way", "Give every student instant clarity", "Keep progress in one place"].map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{item}</p>)}</div></div>
      <p className="text-sm text-muted-foreground">Quizzy · Learn, quiz, grow.</p>
    </aside>
    <main className="flex items-center justify-center bg-[#fcfbfa] px-4 py-10 text-[#28242c] sm:px-8 lg:px-12"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Logo /></div><h1 className="font-display text-3xl font-extrabold text-[#28242c]">{title}</h1><p className="mt-2 text-sm text-[#6f6874]">{subtitle}</p><div className="mt-8">{children}</div></div></main>
  </div>;
}
