import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { GaussianSplatViewer } from "../../../SplatManagement/gaussianSplat.js";
import {
  setActiveSplatViewer,
  clearActiveSplatViewer,
} from "../../../SplatManagement/splatBridge.js";
import type { InsuredItem } from "./data";

type SplatRendererProps = {
  roomName: string;
  splatUrl: string;
  isDamage?: boolean;
  highlightedItem: InsuredItem | null;
  onReadyChange?: (ready: boolean) => void;
};

export function SplatRenderer({
  roomName,
  splatUrl,
  isDamage,
  highlightedItem,
  onReadyChange,
}: SplatRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplatViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !splatUrl) return;

    if (!viewerRef.current) {
      viewerRef.current = new GaussianSplatViewer({ container });
    }

    const viewer = viewerRef.current;
    let cancelled = false;

    setLoading(true);
    setError(null);
    onReadyChange?.(false);

    (async () => {
      try {
        await viewer.load(splatUrl);
        setActiveSplatViewer(viewer, splatUrl);

        const { prepareSuperSplatVR } = await import(
          "../../../SplatManagement/superSplatVR.js"
        );
        await prepareSuperSplatVR(splatUrl).catch((err) => {
          console.warn("[VR] preload failed:", err);
        });

        if (!cancelled) {
          setLoading(false);
          onReadyChange?.(true);
        }
      } catch (err) {
        console.error("[SplatRenderer] load failed:", err);
        if (!cancelled) {
          setError("Could not load 3D reconstruction");
          setLoading(false);
          onReadyChange?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      onReadyChange?.(false);
    };
  }, [splatUrl, onReadyChange]);

  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        clearActiveSplatViewer(viewerRef.current);
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0b0b0f]">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: "none" }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDamage
            ? "radial-gradient(circle at 50% 48%, rgba(255,80,50,0.18), transparent 60%)"
            : "radial-gradient(circle at 50% 48%, rgba(255,138,71,0.14), transparent 60%)",
        }}
      />

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-sm">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading reconstruction…
          </p>
        </div>
      )}

      {error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/80">
          <p className="rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          3D Gaussian Splat · {roomName}
        </p>
      </div>

      <AnimatePresence>
        {highlightedItem && (
          <motion.div
            key={highlightedItem.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="pointer-events-none absolute"
            style={{
              left: `${highlightedItem.marker.x * 100}%`,
              top: `${highlightedItem.marker.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative flex flex-col items-center">
              <span className="absolute h-10 w-10 animate-ping rounded-full bg-primary/40" />
              <span className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/30" />
              <div className="mt-3 whitespace-nowrap rounded-full border border-primary/40 bg-primary/15 px-3 py-1 backdrop-blur-md">
                <span className="text-xs text-primary-foreground/90">
                  <span className="text-primary">●</span> {highlightedItem.name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
