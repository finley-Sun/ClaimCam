import { useState } from "react";
import { Camera, ImageIcon, Crosshair, ShieldCheck, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cn } from "./ui/utils";
import type { InsuredItem } from "./data";

type ItemArchiveCardProps = {
  item: InsuredItem;
  isHighlighted: boolean;
  onHighlight: () => void;
};

const money = (n: number) => `$${n.toLocaleString()}`;

export function ItemArchiveCard({ item, isHighlighted, onHighlight }: ItemArchiveCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border bg-card p-4 transition-all",
          isHighlighted
            ? "border-primary/60 shadow-[0_0_0_1px_var(--brand),0_12px_30px_-12px_var(--brand-glow)]"
            : "border-border hover:border-white/15",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-card-foreground">{item.name}</p>
            <p className="truncate text-xs text-muted-foreground">{item.model}</p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
            {item.category}
          </span>
        </div>

        {/* Value + coverage */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Market value</p>
            <p className="text-sm tabular-nums">{money(item.marketValue)}</p>
          </div>
          <div className="rounded-xl bg-primary/10 px-3 py-2">
            <p className="flex items-center gap-1 text-[11px] text-primary/90">
              <ShieldCheck className="size-3" /> Covered
            </p>
            <p className="text-sm tabular-nums text-primary">{money(item.coverage)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => toast.success("Evidence uploaded", { description: `Photo added to ${item.name}.` })}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/40 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
            title="Add photo evidence"
          >
            <Camera className="size-3.5" /> Add
          </button>
          <button
            onClick={() => setEvidenceOpen(true)}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/40 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
            title="Review evidence"
          >
            <ImageIcon className="size-3.5" /> Review
          </button>
          <button
            onClick={onHighlight}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors",
              isHighlighted
                ? "bg-primary text-primary-foreground"
                : "bg-primary/15 text-primary hover:bg-primary/25",
            )}
            title="Highlight in scene"
          >
            <Crosshair className="size-4" />
          </button>
        </div>
      </div>

      {/* Evidence review dialog */}
      <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" /> {item.name} — Evidence
            </DialogTitle>
            <DialogDescription>
              {item.hasEvidence
                ? "Supporting documents on file for this item."
                : "No evidence on file yet. Add a receipt or photo to strengthen your coverage."}
            </DialogDescription>
          </DialogHeader>
          {item.hasEvidence ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-xl border border-border">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=60"
                  alt="Purchase receipt"
                  className="h-32 w-full object-cover"
                />
                <p className="px-2 py-1.5 text-xs text-muted-foreground">Receipt.pdf</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=400&q=60"
                  alt="Product photo"
                  className="h-32 w-full object-cover"
                />
                <p className="px-2 py-1.5 text-xs text-muted-foreground">Condition.jpg</p>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No evidence uploaded
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
