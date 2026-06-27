import type { StructureRecord } from "./data";
import { StructureArchiveCard } from "./StructureArchiveCard";

type StructureListProps = {
  records: StructureRecord[];
  sceneName: string;
};

export function StructureList({ records, sceneName }: StructureListProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-sm text-white/40">
        No structure documented in this scene yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {records.map((record) => (
        <StructureArchiveCard key={record.id} record={record} sceneName={sceneName} />
      ))}
    </div>
  );
}
