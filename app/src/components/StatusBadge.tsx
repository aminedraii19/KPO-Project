export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status === "published" ? "bg-emerald-400/10 text-emerald-300" : "bg-accent/10 text-accent"}`}>{status === "published" ? "Published" : "Draft"}</span>;
}
