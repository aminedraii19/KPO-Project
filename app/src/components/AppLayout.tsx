import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { BarChart3, BookOpen, CalendarDays, LogOut, Menu, Plus, Settings, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth";
import { trpc } from "@/providers/trpc";
import { errorMessage, initials } from "@/lib/format";
import { Logo } from "./Logo";
import { LoadingScreen } from "./Feedback";

const links = [
  { to: "/dashboard", label: "Overview", icon: BarChart3 },
  { to: "/quizzes", label: "Quizzes", icon: BookOpen },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/students", label: "Students", icon: Users, teacher: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.replace("/"),
    onError: (error) => toast.error(errorMessage(error)),
  });

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const navigation = <><Logo to="/dashboard" />
    <nav className="mt-10 space-y-1" aria-label="Main navigation">
      {links.filter((link) => !link.teacher || user.role === "teacher").map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${isActive ? "bg-secondary text-highlight" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}><Icon className="size-4" />{label}</NavLink>)}
    </nav>
    <div className="mt-auto border-t border-sidebar-border pt-5">
      <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials(user.fullName)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.fullName}</p><p className="text-xs capitalize text-muted-foreground">{user.role}</p></div></div>
      <button className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut className="size-4" />Sign out</button>
    </div></>;

  return <div className="flex min-h-dvh bg-background">
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">{navigation}</aside>
    {menuOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar p-5 transition-transform lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!menuOpen}>
      <button className="icon-button absolute right-3 top-3" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button>{navigation}
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <button className="icon-button lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
        <div className="hidden text-sm text-muted-foreground sm:block">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</div>
        {user.role === "teacher" ? <button className="btn-primary ml-auto" onClick={() => navigate("/quizzes/new")}><Plus className="size-4" />New quiz</button> : <span className="ml-auto text-sm text-muted-foreground">Ready to learn?</span>}
      </header>
      <main id="main-content"><Outlet /></main>
    </div>
  </div>;
}
