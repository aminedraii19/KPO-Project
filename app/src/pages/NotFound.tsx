import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return <main className="grid min-h-dvh place-items-center p-6"><div className="text-center"><Logo /><p className="mt-12 font-display text-7xl font-extrabold text-primary">404</p><h1 className="mt-3 text-2xl font-bold">This question has no answer.</h1><p className="mt-2 text-muted-foreground">The page you’re looking for doesn’t exist.</p><Link to="/" className="btn-primary mt-7"><ArrowLeft className="size-4" />Back home</Link></div></main>;
}
