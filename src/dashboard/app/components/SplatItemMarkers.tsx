import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { GaussianSplatViewer } from "../../../SplatManagement/gaussianSplat.js";
import {
  resolveItemWorldPositions,
  projectWorldToScreen,
} from "../../../SplatManagement/splatMarkers.js";
import type { InsuredItem } from "./data";
import { cn } from "./ui/utils";

type SplatItemMarkersProps = {
  viewer: GaussianSplatViewer;
  items: InsuredItem[];
  highlightedItemId: string | null;
  onHighlight: (id: string) => void;
  enabled: boolean;
};

const HOVER_RADIUS_PX = 36;

export function SplatItemMarkers({
  viewer,
  items,
  highlightedItemId,
  onHighlight,
  enabled,
}: SplatItemMarkersProps) {
  const worldPositionsRef = useRef<Map<string, import("three").Vector3>>(new Map());
  const markerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const screenPositionsRef = useRef<Map<string, { x: number; y: number; visible: boolean }>>(
    new Map(),
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const mkViewer = viewer.getMkViewer();
    const { width, height } = viewer.getContainerSize();
    if (!mkViewer || width < 1 || height < 1) return;

    worldPositionsRef.current = resolveItemWorldPositions(
      mkViewer,
      items,
      width,
      height,
    );
  }, [viewer, items, enabled]);

  // Update marker screen positions via DOM — avoid setState every frame.
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
          screenPositionsRef.current.set(item.id, projected);

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
  }, [viewer, items, enabled]);

  const activeId = hoveredId ?? highlightedItemId;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {items.map((item) => {
        const isActive = activeId === item.id;
        const showLabel = isActive;

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
              {isActive && (
                <span className="absolute h-10 w-10 animate-ping rounded-full bg-primary/30" />
              )}
              <span
                className={cn(
                  "rounded-full ring-4 transition-all",
                  isActive
                    ? "h-3 w-3 bg-primary ring-primary/30"
                    : "h-2.5 w-2.5 bg-primary/80 ring-primary/15",
                )}
              />
              <AnimatePresence>
                {showLabel && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="pointer-events-none mt-2 whitespace-nowrap rounded-full border border-primary/40 bg-primary/15 px-3 py-1 backdrop-blur-md"
                  >
                    <span className="text-xs text-primary-foreground/90">
                      <span className="text-primary">●</span> {item.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
