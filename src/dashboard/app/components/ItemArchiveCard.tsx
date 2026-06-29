import { useState } from "react";
import { Crosshair, Sparkles, ScanLine, FileText } from "lucide-react";
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

const CATEGORY_COLORS: Record<string, string> = {
  Furniture: "bg-[#7ae3af]",
  Instrument: "bg-[#b485f7]",
  Audio: "bg-[#ffd166]",
  Appliances: "bg-[#ffb991]",
  Valuables: "bg-[#f9a8d4]",
  Equipment: "bg-[#c9cfd6]",
};

const money = (n: number) => `$${n.toLocaleString()}`;

export function ItemArchiveCard({ item, isHighlighted, onHighlight }: ItemArchiveCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const categoryColor = CATEGORY_COLORS[item.category] ?? "bg-[#c9cfd6]";
  const a = isHighlighted;

  return (
    <>
      <div className={cn("rounded-2xl transition-all", a ? "bg-[#FF8A47]" : "bg-[#1B1E21]")}>
        <div className="flex flex-col gap-2 p-3">
          {/* Item name + category badge */}
          <div className="flex items-center justify-between gap-2">
            <p className={cn("truncate text-sm font-medium", a ? "text-[#1A0E07]" : "text-white")}>{item.name}</p>
            {item.category === "Electronics" ? (
              <span className={cn(
                "shrink-0 rounded-lg border px-2 py-0.5 text-xs",
                a ? "border-[#396ECC] bg-[#1C3766] text-[#C7DBFF]" : "border-[#2B5399] bg-[#0E1C33] text-[#B5D0FF]",
              )}>
                {item.category}
              </span>
            ) : item.category === "Furniture" ? (
              <span className={cn(
                "shrink-0 rounded-lg border px-2 py-0.5 text-xs",
                a ? "border-[#49B27E] bg-[#122D20] text-[#5BDF9E]" : "border-[#37865F] bg-[#091610] text-[#7AE3AF]",
              )}>
                {item.category}
              </span>
            ) : item.category === "Instrument" ? (
              <span className={cn(
                "shrink-0 rounded-lg border px-2 py-0.5 text-xs",
                a ? "border-[#8152C4] bg-[#201431] text-[#D9C2FB]" : "border-[#613D93] bg-[#100A18] text-[#C7A3F9]",
              )}>
                {item.category}
              </span>
            ) : (
              <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-xs text-black", categoryColor)}>
                {item.category}
              </span>
            )}
          </div>

          {/* Model info */}
          <p className={cn("text-[11px] truncate", a ? "text-[#331C0E]" : "text-[#9CA8B7]")}>{item.model}</p>

          {/* AI indicator + purchase date */}
          <div className="flex items-center justify-between">
            {item.aiAutofilled ? (
              <span className={cn("flex items-center gap-0.5 text-[11px]", a ? "text-[#66371C]" : "text-[#FFA16C]")}>
                <Sparkles className="size-3" />
                Auto-filled from receipt
              </span>
            ) : (
              <span className={cn("text-[11px]", a ? "text-[#66371C]" : "text-[#6B7786]")}>Manually added</span>
            )}
            {item.purchaseDate && (
              <span className={cn("text-[11px]", a ? "text-[#66371C]" : "text-[#9CA8B7]")}>Purchased {item.purchaseDate}</span>
            )}
          </div>

          {/* Value chips */}
          <div className="flex gap-3">
            <div className={cn("flex-1 rounded-xl px-3 py-2", a ? "bg-[#CC6E39]" : "bg-[#363C43]")}>
              <p className={cn("text-[11px]", a ? "text-[#66371C]" : "text-[#9CA8B7]")}>Est. replacement</p>
              <p className={cn("mt-1 text-sm font-medium tabular-nums", a ? "text-[#1A0E07]" : "text-white")}>
                {money(item.replacementValue)}
              </p>
            </div>
            <div className={cn("flex-1 rounded-xl px-3 py-2", a ? "bg-[#CC6E39]" : "bg-[#363C43]")}>
              <p className={cn("text-[11px]", a ? "text-[#66371C]" : "text-[#9CA8B7]")}>Est. market value</p>
              <p className={cn("mt-1 text-sm font-medium tabular-nums", a ? "text-[#1A0E07]" : "text-white")}>
                {money(item.marketValue)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className={cn("h-px", a ? "bg-[#CC6E39]" : "bg-[#2A2F35]")} />

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEvidenceOpen(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full border py-1.5 text-xs transition-colors",
                a
                  ? "border-black/[0.15] bg-black/[0.12] text-[#1A0E07] hover:border-black/[0.20] hover:bg-black/[0.20]"
                  : "border-white/10 bg-[#363C43] text-[#C9CFD6] hover:border-white/20 hover:bg-[#505964] hover:text-white active:border-white/25 active:bg-[#6B7786] active:text-white",
              )}
            >
              <FileText className="size-3.5" />
              Receipt
            </button>
            <button
              onClick={() => toast.info("Rescan queued", { description: `Scheduled a new capture for ${item.name}.` })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full border py-1.5 text-xs transition-colors",
                a
                  ? "border-black/[0.15] bg-black/[0.12] text-[#1A0E07] hover:border-black/[0.20] hover:bg-black/[0.20]"
                  : "border-white/10 bg-[#363C43] text-[#C9CFD6] hover:border-white/20 hover:bg-[#505964] hover:text-white active:border-white/25 active:bg-[#6B7786] active:text-white",
              )}
            >
              <ScanLine className="size-3.5" />
              Rescan
            </button>
            <button
              onClick={onHighlight}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                a
                  ? "border-[#FF8A47] bg-[#FF8A47]"
                  : "border-white/20 bg-[#363C43] hover:border-white/30 hover:bg-[#505964]",
              )}
              title="Show in view"
            >
              <Crosshair className={cn("size-3.5", a ? "text-[#1A0E07]" : "text-[#8695A7]")} />
            </button>
          </div>
        </div>
      </div>

      {/* Evidence dialog */}
      <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4 text-primary" /> {item.name} — Evidence
            </DialogTitle>
            <DialogDescription>
              {item.hasEvidence
                ? "Supporting documents on file for this item."
                : "No evidence on file yet. Add a receipt or photo to strengthen your coverage."}
            </DialogDescription>
          </DialogHeader>
          {item.evidence ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-xl border border-border">
                <ImageWithFallback
                  src={item.evidence.before}
                  alt={`${item.name} before`}
                  className="h-32 w-full object-cover"
                />
                <p className="px-2 py-1.5 text-xs text-muted-foreground">Before</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <ImageWithFallback
                  src={item.evidence.after}
                  alt={`${item.name} after`}
                  className="h-32 w-full object-cover"
                />
                <p className="px-2 py-1.5 text-xs text-muted-foreground">After</p>
              </div>
            </div>
          ) : item.hasEvidence ? (
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
