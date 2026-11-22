import { AlertCircle, LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingScreen({ label = "Loading your workspace" }: { label?: string }) {
  return <div className="grid min-h-[50dvh] place-items-center" role="status"><div className="text-center"><LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-primary" /><p className="text-sm text-muted-foreground">{label}</p></div></div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="surface flex flex-col items-start gap-3 p-6" role="alert"><AlertCircle className="size-6 text-red-400" /><div><h2 className="font-bold">We couldn’t load this view</h2><p className="mt-1 text-sm text-muted-foreground">{message}</p></div>{retry && <button className="btn-secondary" onClick={retry}>Try again</button>}</div>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center py-14 text-center"><Icon className="mb-4 size-8 text-primary" /><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p></div>{action}</div>;
}
