import { Link } from "react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return <Link to={to} className="inline-flex items-center gap-2.5 rounded-lg font-display text-2xl font-extrabold tracking-[-0.05em]" aria-label="Quizzy home">
    <span className="grid size-8 place-items-center rounded-[10px] bg-highlight text-lg text-background">Q</span>
    <span className="text-gradient">Quizzy</span>
  </Link>;
}
