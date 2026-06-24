import { ShieldAlert, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "./ui/utils";
import type { Room } from "./data";

const RISK_STYLE = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
} as const;

type SceneLiabilityProps = {
  room: Room;
};

export function SceneLiability({ room }: SceneLiabilityProps) {
  const risk = room.risk;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert className="size-3.5" /> Liability exposure for {room.name}
        </p>
        <button
          onClick={() =>
            toast("Add liability note", {
              description: "Document inspections, signage, or safety measures.",
            })
          }
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
          title="Add note"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {risk && (
        <div className={cn("rounded-2xl border p-4", RISK_STYLE[risk.level])}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide opacity-80">Risk level</span>
            <span className="rounded-full bg-background/30 px-2 py-0.5 text-xs capitalize">
              {risk.level}
            </span>
          </div>
          <p className="mt-2 text-sm leading-snug">{risk.detail}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm">
          <FileText className="size-4 text-primary" /> Coverage note
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          This exposure is documented under the liability portion of your homeowner
          policy. The captured scene serves as dated evidence of safety conditions
          (fencing, signage, maintenance) should a claim arise.
        </p>
      </div>
    </div>
  );
}
