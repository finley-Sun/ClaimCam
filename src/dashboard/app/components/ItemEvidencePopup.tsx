import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { InsuredItem } from "./data";

type ItemEvidencePopupProps = {
  item: InsuredItem;
};

export function ItemEvidencePopup({ item }: ItemEvidencePopupProps) {
  const evidence = item.evidence;
  if (!evidence) return null;

  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-4 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/85 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 px-3 py-2">
          <p className="truncate text-xs font-medium text-white">{item.name}</p>
          <p className="text-[10px] text-white/60">Before & after evidence</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/10">
          <div className="bg-black/40">
            <ImageWithFallback
              src={evidence.before}
              alt={`${item.name} before`}
              className="aspect-[4/3] w-full object-cover"
            />
            <p className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-emerald-400">
              Before
            </p>
          </div>
          <div className="bg-black/40">
            <ImageWithFallback
              src={evidence.after}
              alt={`${item.name} after`}
              className="aspect-[4/3] w-full object-cover"
            />
            <p className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-orange-400">
              After
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
