import {
  PaintRoller,
  Grid3x3,
  Refrigerator,
  Lightbulb,
  Blinds,
  ArrowRight,
  AlertTriangle,
  GitCompareArrows,
} from "lucide-react";
import { cn } from "./ui/utils";
import type { ConditionRecord } from "./data";

const ICONS: Record<string, typeof PaintRoller> = {
  PaintRoller,
  Grid3x3,
  Refrigerator,
  Lightbulb,
  Blinds,
};

type ConditionCompareProps = {
  records: ConditionRecord[];
};

export function ConditionCompare({ records }: ConditionCompareProps) {
  const flaggedCount = records.filter((c) => c.flagged).length;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm">
          <GitCompareArrows className="size-4 text-primary" /> Move-in vs Move-out
        </h3>
        <p className="text-xs text-muted-foreground">
          Protects your deposit — separates landlord fixtures from your belongings
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border bg-card px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">Items tracked</p>
          <p className="tabular-nums">{records.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[11px] text-amber-400">
            <AlertTriangle className="size-3" /> Flagged changes
          </p>
          <p className="tabular-nums text-amber-400">{flaggedCount}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {records.map((item) => {
          const Icon = ICONS[item.icon] ?? PaintRoller;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border bg-card p-3.5",
                item.flagged ? "border-amber-500/40" : "border-border",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm">{item.name}</p>
                {item.flagged && (
                  <AlertTriangle className="ml-auto size-3.5 text-amber-400" />
                )}
              </div>

              <div className="mt-3 flex items-stretch gap-2">
                <div className="flex-1 rounded-xl bg-secondary/50 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Before Move In
                  </p>
                  <p className="mt-0.5 text-xs leading-snug">{item.moveIn}</p>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <ArrowRight className="size-4" />
                </div>
                <div
                  className={cn(
                    "flex-1 rounded-xl px-2.5 py-2",
                    item.flagged ? "bg-amber-500/10" : "bg-secondary/50",
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Move Out
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs leading-snug",
                      item.flagged && "text-amber-400",
                    )}
                  >
                    {item.current}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
