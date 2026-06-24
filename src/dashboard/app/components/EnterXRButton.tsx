import { useEffect, useState } from "react";
import { Glasses, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  enterSuperSplatVR,
  exitSuperSplatVR,
  hasActiveSuperSplatVR,
  isSuperSplatVRReady,
  isSuperSplatVRLoading,
  onSuperSplatXREnd,
  prepareSuperSplatVR,
  teardownSuperSplatVR,
  warmSuperSplatVR,
} from "../../../SplatManagement/superSplatVR.js";
import { prefersSequentialVRLoad } from "../../../SplatManagement/xrDevice.js";
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

  const syncHeadsetReady = () => {
    setHeadsetReady(isSuperSplatVRReady());
    setLoadingVR(isSuperSplatVRLoading());
  };

  useEffect(() => {
    onSuperSplatXREnd(async () => {
      setInXR(false);
      setLoadingVR(false);
      await restoreSplatAfterXR();
      syncHeadsetReady();
    });
  }, []);

  useEffect(() => {
    if (!vrReady || !splatUrl) {
      setHeadsetReady(false);
      setLoadingVR(false);
      return;
    }

    syncHeadsetReady();
    if (!prefersSequentialVRLoad()) {
      warmSuperSplatVR(splatUrl);
    }

    const id = window.setInterval(syncHeadsetReady, 350);
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
        if (prefersSequentialVRLoad()) {
          destroySplatForXR();
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
        await prepareSuperSplatVR(splatUrl);
        setHeadsetReady(true);
      } catch (err) {
        console.error("[EnterXR] VR preload failed:", err);
        await teardownSuperSplatVR();
        toast.error("VR not ready", {
          description: prefersSequentialVRLoad()
            ? "Freeing GPU memory and loading VR. Tap again in a moment."
            : "Headset viewer is still loading. Try again in a moment.",
        });
        setLoadingVR(false);
        return;
      }
    }

    setLoadingVR(true);
    if (!prefersSequentialVRLoad()) {
      destroySplatForXR();
    }

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
      : loadingVR || isSuperSplatVRLoading()
        ? "Preparing VR…"
        : "Enter XR";

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
