import { useEffect, useState } from "react";
import { Glasses, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  enterSuperSplatVR,
  exitSuperSplatVR,
  hasActiveSuperSplatVR,
  isSuperSplatVRReady,
  onSuperSplatXREnd,
  prepareSuperSplatVR,
} from "../../../SplatManagement/superSplatVR.js";
import {
  destroySplatForXR,
  restoreSplatAfterXR,
} from "../../../SplatManagement/splatBridge.js";

type EnterXRButtonProps = {
  splatUrl: string;
  vrReady: boolean;
};

export function EnterXRButton({ splatUrl, vrReady }: EnterXRButtonProps) {
  const [inXR, setInXR] = useState(false);
  const [loadingVR, setLoadingVR] = useState(false);
  const [headsetReady, setHeadsetReady] = useState(isSuperSplatVRReady());

  useEffect(() => {
    onSuperSplatXREnd(async () => {
      setInXR(false);
      setLoadingVR(false);
      await restoreSplatAfterXR();
    });
  }, []);

  useEffect(() => {
    if (!vrReady) {
      setHeadsetReady(false);
      return;
    }

    if (isSuperSplatVRReady()) {
      setHeadsetReady(true);
      return;
    }

    const id = window.setInterval(() => {
      if (isSuperSplatVRReady()) {
        setHeadsetReady(true);
        clearInterval(id);
      }
    }, 400);

    return () => clearInterval(id);
  }, [vrReady, splatUrl]);

  const handleClick = async () => {
    if (hasActiveSuperSplatVR() || inXR) {
      exitSuperSplatVR();
      setInXR(false);
      return;
    }

    if (!vrReady) {
      toast.error("Scene not ready", {
        description: "Wait for the reconstruction to appear first.",
      });
      return;
    }

    if (!isSuperSplatVRReady()) {
      setLoadingVR(true);
      try {
        await prepareSuperSplatVR(splatUrl);
        setHeadsetReady(true);
      } catch (err) {
        console.error("[EnterXR] VR preload failed:", err);
        toast.error("VR not ready", {
          description: "Headset viewer is still loading. Try again in a moment.",
        });
        setLoadingVR(false);
        return;
      }
    }

    setLoadingVR(true);
    destroySplatForXR();

    try {
      enterSuperSplatVR();
      setInXR(true);
    } catch (err) {
      console.error("[EnterXR] failed:", err);
      toast.error("VR unavailable", {
        description: "Use HTTPS on your headset and try again.",
      });
      restoreSplatAfterXR();
    } finally {
      setLoadingVR(false);
    }
  };

  const label =
    inXR || hasActiveSuperSplatVR()
      ? "Exit to Browser"
      : loadingVR
        ? "Preparing VR…"
        : headsetReady
          ? "Enter XR"
          : "VR loading…";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!splatUrl || (!vrReady && !loadingVR)}
      className="group flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-[0_12px_36px_-10px_var(--brand-glow)] transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
    >
      {loadingVR ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Glasses className="size-5" />
      )}
      <span>{label}</span>
    </button>
  );
}
