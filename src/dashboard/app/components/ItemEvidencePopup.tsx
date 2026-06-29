import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { InsuredItem } from "./data";

type ItemEvidencePopupProps = {
  item: InsuredItem;
};

export function ItemEvidencePopup({ item }: ItemEvidencePopupProps) {
  const receipt = item.evidence?.receipt;
  if (!receipt) return null;

  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-4 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/85 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 px-3 py-2">
          <p className="truncate text-xs font-medium text-white">{item.name}</p>
          <p className="text-[10px] text-white/60">Purchase receipt</p>
        </div>
        <ImageWithFallback
          src={receipt}
          alt={`${item.name} receipt`}
          className="aspect-[3/4] w-full object-cover"
        />
      </div>
    </div>
  );
}
