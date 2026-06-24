import { Wind, Droplets, Zap, Ruler, Hammer, Plus, FileStack } from "lucide-react";
import { toast } from "sonner";
import type { StructureRecord } from "./data";

const ICONS: Record<string, typeof Wind> = {
  Wind,
  Droplets,
  Zap,
  Ruler,
  Hammer,
};

const money = (n: number) => `$${n.toLocaleString()}`;

type StructureListProps = {
  records: StructureRecord[];
  sceneName: string;
};

export function StructureList({ records, sceneName }: StructureListProps) {
  const totalRebuild = records.reduce((sum, d) => sum + d.rebuildCost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileStack className="size-3.5" /> Rebuild details for {sceneName}
        </p>
        <button
          onClick={() =>
            toast("Add structural document", {
              description: "Upload blueprints, permits, or contractor invoices.",
            })
          }
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
          title="Add documentation"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Estimated rebuild total for this scene */}
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
        <p className="text-xs text-primary/90">Estimated rebuild value</p>
        <p className="tabular-nums text-primary">{money(totalRebuild)}</p>
      </div>

      <div className="space-y-2.5">
        {records.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No structural records for this scene yet.
          </div>
        )}
        {records.map((doc) => {
          const Icon = ICONS[doc.icon] ?? Hammer;
          return (
            <div key={doc.id} className="rounded-2xl border border-border bg-card p-3.5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm">{doc.name}</p>
                    <span className="shrink-0 tabular-nums text-sm text-primary">
                      {money(doc.rebuildCost)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{doc.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Updated {doc.updated}
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
