import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ConfirmDialog({ open, title, description, onClose, onConfirm, busy }: { open: boolean; title: string; description: string; onClose: () => void; onConfirm: () => void; busy?: boolean }) {
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="border-border bg-card text-card-foreground">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <DialogFooter><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-secondary border-red-400/40 text-red-300 hover:bg-red-400/10" disabled={busy} onClick={onConfirm}>{busy ? "Deleting…" : "Delete"}</button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
