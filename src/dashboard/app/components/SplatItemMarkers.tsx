import { useEffect, useRef, useState } from "react";
import type { GaussianSplatViewer } from "../../../SplatManagement/gaussianSplat.js";
import {
  resolveItemWorldPositions,
  projectWorldToScreen,
} from "../../../SplatManagement/splatMarkers.js";
import type { InsuredItem } from "./data";
import { ItemEvidencePopup } from "./ItemEvidencePopup";
import { cn } from "./ui/utils";

type SplatItemMarkersProps = {
  viewer: GaussianSplatViewer;
  items: InsuredItem[];
  isDamage?: boolean;
  highlightedItemId: string | null;
  onHighlight: (id: string) => void;
  enabled: boolean;
};

const HOVER_RADIUS_PX = 36;

export function SplatItemMarkers({
  viewer,
  items,
  isDamage = false,
  highlightedItemId,
  onHighlight,
  enabled,
}: SplatItemMarkersProps) {
  const worldPositionsRef = useRef<Map<string, import("three").Vector3>>(new Map());
  const markerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    worldPositionsRef.current = new Map();
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 48;

    const tryResolve = () => {
      if (cancelled) return;

      const mkViewer = viewer.getMkViewer();
      const { width, height } = viewer.getContainerSize();
      if (!mkViewer || width < 1 || height < 1) {
        schedule();
        return;
      }

      const pending = items.filter((item) => !worldPositionsRef.current.has(item.id));
      if (pending.length > 0) {
        const batch = resolveItemWorldPositions(mkViewer, pending, width, height, {
          isDamage,
        });
        for (const [id, pos] of batch) {
          worldPositionsRef.current.set(id, pos);
        }
      }

      attempts += 1;
      if (worldPositionsRef.current.size < items.length && attempts < maxAttempts) {
        schedule();
      }
    };

    const schedule = () => {
      window.setTimeout(tryResolve, 200);
    };

    tryResolve();
    return () => {
      cancelled = true;
    };
  }, [viewer, items, enabled, isDamage]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    const tick = () => {
      const mkViewer = viewer.getMkViewer();
      const { width, height } = viewer.getContainerSize();
      const camera = mkViewer?.camera;

      if (mkViewer && camera && width > 0 && height > 0) {
        for (const item of items) {
          const world = worldPositionsRef.current.get(item.id);
          const el = markerRefs.current.get(item.id);
          if (!world || !el) continue;

          const projected = projectWorldToScreen(world, camera, width, height);

          if (projected.visible) {
            el.style.display = "block";
            el.style.left = `${projected.x}px`;
            el.style.top = `${projected.y}px`;
          } else {
            el.style.display = "none";
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [viewer, items, enabled, isDamage]);

  const activeId = hoveredId ?? highlightedItemId;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {items.map((item) => {
        const isActive = activeId === item.id;

        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) markerRefs.current.set(item.id, el);
              else markerRefs.current.delete(item.id);
            }}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
            style={{ display: "none" }}
            onPointerEnter={() => setHoveredId(item.id)}
            onPointerLeave={() =>
              setHoveredId((prev) => (prev === item.id ? null : prev))
            }
            onClick={(event) => {
              event.stopPropagation();
              onHighlight(item.id);
            }}
          >
            <div
              className="relative flex flex-col items-center justify-center"
              style={{ width: HOVER_RADIUS_PX * 2, height: HOVER_RADIUS_PX * 2 }}
            >
              {isActive && item.evidence?.receipt && <ItemEvidencePopup item={item} />}
              {isActive && (
                <span className="absolute h-10 w-10 animate-ping rounded-full bg-primary/30" />
              )}
              <span
                className={cn(
                  "rounded-full ring-4 transition-all",
                  isActive
                    ? "h-3.5 w-3.5 bg-primary ring-primary/40 shadow-[0_0_12px_var(--brand-glow)]"
                    : "h-3 w-3 bg-primary/90 ring-primary/25",
                )}
              />
              <div
                className={cn(
                  "pointer-events-none mt-2 whitespace-nowrap rounded-full border px-3 py-1 backdrop-blur-md transition-all",
                  isActive
                    ? "border-primary/50 bg-black/75 text-white shadow-lg"
                    : "hidden",
                )}
              >
                <span className="text-xs font-medium">
                  <span className="text-primary">●</span> {item.name}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
