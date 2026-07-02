import { useEffect, useState } from "react";
import { Glasses, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  loadHeadsetVR,
  enterSplatXR,
  onSplatXREnd,
  clearActiveSplatUrl,
} from "../../../SplatManagement/splatBridge.js";
import { teardownSuperSplatVR } from "../../../SplatManagement/superSplatVR.js";

type HeadsetVRViewProps = {
  splatUrl: string;
  roomName: string;
  onReadyChange?: (ready: boolean) => void;
};

type Phase = "loading" | "tap" | "error";

/**
 * Quest / headset browsers: fullscreen VR-only path.
 * No embedded 2D preview — load splat fullscreen, then tap to enter immersive VR.
 */
export function HeadsetVRView({ splatUrl, roomName, onReadyChange }: HeadsetVRViewProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setErrorMsg(null);
    onReadyChange?.(false);

    (async () => {
      try {
        await loadHeadsetVR(splatUrl);
        if (cancelled) return;
        setPhase("tap");
        onReadyChange?.(true);
      } catch (err) {
        console.error("[HeadsetVRView] load failed:", err);
        if (!cancelled) {
          setPhase("error");
          setErrorMsg(err instanceof Error ? err.message : "Could not load scene");
          onReadyChange?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearActiveSplatUrl();
      onReadyChange?.(false);
      teardownSuperSplatVR();
    };
  }, [splatUrl, onReadyChange]);

  useEffect(() => {
    onSplatXREnd(() => {
      setPhase("tap");
    });
  }, []);

  const handleEnterVR = () => {
    try {
      enterSplatXR();
    } catch (err) {
      console.error("[HeadsetVRView] enter VR failed:", err);
      toast.error("Could not enter VR", {
        description: err instanceof Error ? err.message : "Try tapping again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-[#0b0b0f]">
      {phase === "loading" && (
        <div className="absolute inset-0 z-[10001] flex flex-col items-center justify-center gap-4 bg-[#0b0b0f]/90">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading {roomName}…</p>
        </div>
      )}

      {phase === "tap" && (
        <button
          type="button"
          onClick={handleEnterVR}
          className="absolute inset-0 z-[10001] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-primary shadow-[0_0_48px_var(--brand-glow)]">
            <Glasses className="size-10 text-primary-foreground" />
          </span>
          <span className="text-lg font-medium text-white">Tap to Enter VR</span>
          <span className="text-xs text-white/60">{roomName}</span>
        </button>
      )}

      {phase === "error" && (
        <div className="absolute inset-0 z-[10001] flex flex-col items-center justify-center gap-3 bg-[#0b0b0f]">
          <p className="rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {errorMsg ?? "Could not load reconstruction"}
          </p>
        </div>
      )}
    </div>
  );
}
