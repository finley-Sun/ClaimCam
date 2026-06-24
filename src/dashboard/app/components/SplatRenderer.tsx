import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { GaussianSplatViewer } from "../../../SplatManagement/gaussianSplat.js";
import {
  setActiveSplatViewer,
  clearActiveSplatViewer,
} from "../../../SplatManagement/splatBridge.js";
import { SplatItemMarkers } from "./SplatItemMarkers";
import type { InsuredItem } from "./data";

type SplatRendererProps = {
  roomName: string;
  splatUrl: string;
  items: InsuredItem[];
  isDamage?: boolean;
  highlightedItemId: string | null;
  onHighlight: (id: string) => void;
  onReadyChange?: (ready: boolean) => void;
};

export function SplatRenderer({
  roomName,
  splatUrl,
  items,
  isDamage,
  highlightedItemId,
  onHighlight,
  onReadyChange,
}: SplatRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplatViewer | null>(null);
  const onReadyRef = useRef(onReadyChange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spatialReady, setSpatialReady] = useState(false);

  onReadyRef.current = onReadyChange;

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
    setSpatialReady(false);
    onReadyRef.current?.(false);

    (async () => {
      try {
        await viewer.load(splatUrl);
        setActiveSplatViewer(viewer, splatUrl);

        if (!cancelled) {
          setLoading(false);
          onReadyRef.current?.(true);
          setSpatialReady(true);

          // Warm the VR iframe in the background once 2D is interactive.
          // The .spz should already be in the HTTP cache from the 2D viewer.
          const warmVR = () => {
            import("../../../SplatManagement/superSplatVR.js").then(
              ({ warmSuperSplatVR }) => warmSuperSplatVR(splatUrl),
            );
          };
          import("../../../SplatManagement/xrDevice.js").then(({ prefersSequentialVRLoad }) => {
            if (prefersSequentialVRLoad()) return;
            if ("requestIdleCallback" in window) {
              window.requestIdleCallback(warmVR, { timeout: 2500 });
            } else {
              window.setTimeout(warmVR, 1200);
            }
          });
        }
      } catch (err) {
        console.error("[SplatRenderer] load failed:", err);
        if (!cancelled) {
          setError("Could not load 3D reconstruction");
          setLoading(false);
          onReadyRef.current?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setSpatialReady(false);
      onReadyRef.current?.(false);
    };
  }, [splatUrl]);

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

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDamage
            ? "radial-gradient(circle at 50% 48%, rgba(255,80,50,0.18), transparent 60%)"
            : "radial-gradient(circle at 50% 48%, rgba(255,138,71,0.14), transparent 60%)",
        }}
      />

      {spatialReady && viewerRef.current && items.length > 0 && (
        <SplatItemMarkers
          viewer={viewerRef.current}
          items={items}
          highlightedItemId={highlightedItemId}
          onHighlight={onHighlight}
          enabled={!loading}
        />
      )}

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-sm">
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

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-[6] -translate-x-1/2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          3D Gaussian Splat · {roomName}
        </p>
        {spatialReady && items.length > 0 && (
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            Item labels track in 3D · click a pin to highlight in archive
          </p>
        )}
      </div>
    </div>
  );
}
