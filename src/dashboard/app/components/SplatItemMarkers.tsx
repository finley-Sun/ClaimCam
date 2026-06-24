import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { GaussianSplatViewer } from "../../../SplatManagement/gaussianSplat.js";
import {
  resolveItemWorldPositions,
  projectWorldToScreen,
} from "../../../SplatManagement/splatMarkers.js";
import type { InsuredItem } from "./data";
import { cn } from "./ui/utils";

type ScreenMarker = {
  id: string;
  name: string;
  x: number;
  y: number;
  visible: boolean;
};

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
  const overlayRef = useRef<HTMLDivElement>(null);
  const worldPositionsRef = useRef<Map<string, import("three").Vector3>>(new Map());
  const [markers, setMarkers] = useState<ScreenMarker[]>([]);
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

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    const tick = () => {
      const mkViewer = viewer.getMkViewer();
      const { width, height } = viewer.getContainerSize();
      const camera = mkViewer?.camera;

      if (mkViewer && camera && width > 0 && height > 0) {
        const next: ScreenMarker[] = [];

        for (const item of items) {
          const world = worldPositionsRef.current.get(item.id);
          if (!world) continue;

          const projected = projectWorldToScreen(world, camera, width, height);
          next.push({
            id: item.id,
            name: item.name,
            x: projected.x,
            y: projected.y,
            visible: projected.visible,
          });
        }

        setMarkers(next);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [viewer, items, enabled]);

  const handlePointerMove = (event: React.PointerEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    let closest: { id: string; dist: number } | null = null;

    for (const m of markers) {
      if (!m.visible) continue;
      const dist = Math.hypot(m.x - px, m.y - py);
      if (dist <= HOVER_RADIUS_PX && (!closest || dist < closest.dist)) {
        closest = { id: m.id, dist };
      }
    }

    setHoveredId(closest?.id ?? null);
  };

  const activeId = hoveredId ?? highlightedItemId;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-[5]"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoveredId(null)}
      onClick={() => {
        if (hoveredId) onHighlight(hoveredId);
      }}
    >
      {markers.map((m) => {
        if (!m.visible) return null;

        const isActive = activeId === m.id;
        const showLabel = isActive;

        return (
          <div
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: m.x, top: m.y }}
          >
            <div className="relative flex flex-col items-center">
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
                      <span className="text-primary">●</span> {m.name}
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
