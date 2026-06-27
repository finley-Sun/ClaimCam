import { Sparkles, FileText, ScanLine, Crosshair } from "lucide-react";
import { toast } from "sonner";
import type { StructureRecord } from "./data";

type StructureArchiveCardProps = {
  record: StructureRecord;
  sceneName: string;
};

const money = (n: number) => `$${n.toLocaleString()}`;

export function StructureArchiveCard({ record, sceneName }: StructureArchiveCardProps) {
  return (
    <div className="rounded-2xl bg-[#1B1E21]">
      <div className="flex flex-col gap-2 p-3">
        {/* Item name */}
        <p className="text-sm font-medium text-white">{record.name}</p>

        {/* Room + area */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-[#8695A7]">
            {sceneName}{record.area ? ` · ${record.area}` : ""}
          </p>
          <p className="text-[11px] text-[#9CA8B7]">{record.detail}</p>
        </div>

        {/* Source indicator + installed date */}
        <div className="flex items-center justify-between">
          {record.source ? (
            <span className="flex items-center gap-0.5 text-[11px] text-[#FFA16C]">
              <Sparkles className="size-3" />
              {record.source}
            </span>
          ) : (
            <span className="text-[11px] text-[#6B7786]">Manually added</span>
          )}
          {record.installedDate && (
            <span className="text-[11px] text-[#9CA8B7]">Installed {record.installedDate}</span>
          )}
        </div>

        {/* Est. rebuild cost chip — full width */}
        <div className="rounded-xl bg-[#363C43] px-3 py-2">
          <p className="text-[11px] text-[#9CA8B7]">Est. rebuild cost</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm font-medium text-white tabular-nums">{money(record.rebuildCost)}</p>
            {record.costFormula && (
              <p className="text-[11px] text-[#9CA8B7] tabular-nums">{record.costFormula}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2A2F35]" />

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info("Invoice", { description: `Opening invoice for ${record.name}.` })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-[#363C43] py-1.5 text-xs text-[#C9CFD6] transition-colors hover:border-white/20 hover:bg-[#505964] hover:text-white active:border-white/25 active:bg-[#6B7786] active:text-white"
          >
            <FileText className="size-3.5" />
            Invoice
          </button>
          <button
            onClick={() => toast.info("Rescan queued", { description: `Scheduled a new capture for ${record.name}.` })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-[#363C43] py-1.5 text-xs text-[#C9CFD6] transition-colors hover:border-white/20 hover:bg-[#505964] hover:text-white active:border-white/25 active:bg-[#6B7786] active:text-white"
          >
            <ScanLine className="size-3.5" />
            Rescan
          </button>
          <button
            onClick={() => toast.info("Highlighted in scene", { description: record.name })}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#363C43] transition-colors hover:border-white/30 hover:bg-[#505964]"
            title="Show in view"
          >
            <Crosshair className="size-3.5 text-[#8695A7]" />
          </button>
        </div>
      </div>
    </div>
  );
}
