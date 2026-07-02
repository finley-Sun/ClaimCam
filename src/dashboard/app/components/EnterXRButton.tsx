import { useEffect, useState } from "react";
import { Glasses, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  checkHeadsetVRAvailable,
  enterSplatXR,
  exitSplatXR,
  isSplatXRActive,
  onSplatXREnd,
} from "../../../SplatManagement/splatBridge.js";
import { isHeadsetBrowser } from "../../../SplatManagement/xrDevice.js";

type EnterXRButtonProps = {
  splatUrl: string;
  vrReady: boolean;
};

export function EnterXRButton({ splatUrl, vrReady }: EnterXRButtonProps) {
  const [inXR, setInXR] = useState(isSplatXRActive());
  const [entering, setEntering] = useState(false);
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);

  useEffect(() => {
    onSplatXREnd(() => {
      setInXR(false);
      setEntering(false);
    });
  }, []);

  useEffect(() => {
    checkHeadsetVRAvailable().then(setXrSupported);
  }, []);

  useEffect(() => {
    if (inXR && isSplatXRActive()) {
      setEntering(false);
    }
  }, [inXR]);

  const handleClick = () => {
    if (inXR || isSplatXRActive()) {
      exitSplatXR();
      setInXR(false);
      setEntering(false);
      return;
    }

    if (!vrReady) {
      toast.error("Scene not ready", {
        description: "Wait until the reconstruction appears, then tap Fullscreen.",
      });
      return;
    }

    if (xrSupported === false) {
      toast.error("Fullscreen unavailable", {
        description: isHeadsetBrowser()
          ? "This browser does not support fullscreen mode."
          : "Open this page in your headset browser for fullscreen mode.",
      });
      return;
    }

    setEntering(true);
    try {
      enterSplatXR();
      setInXR(true);
    } catch (err) {
      console.error("[EnterXR] failed:", err);
      setEntering(false);
      toast.error("Could not enter fullscreen", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  };

  const label =
    inXR || isSplatXRActive()
      ? "Exit Fullscreen"
      : entering
        ? "Entering…"
        : "Enter Fullscreen";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!splatUrl || (!vrReady && !entering)}
      className="group flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-[0_12px_36px_-10px_var(--brand-glow)] transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
    >
      {entering && !isSplatXRActive() ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Glasses className="size-5" />
      )}
      <span>{label}</span>
    </button>
  );
}
