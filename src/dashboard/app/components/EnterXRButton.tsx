import { useEffect, useState } from "react";
import { Glasses, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  enterSuperSplatVR,
  exitSuperSplatVR,
  hasActiveSuperSplatVR,
  isSuperSplatVRReady,
  onSuperSplatXREnd,
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

  useEffect(() => {
    onSuperSplatXREnd(async () => {
      setInXR(false);
      setLoadingVR(false);
      await restoreSplatAfterXR();
    });
  }, []);

  const handleClick = () => {
    if (hasActiveSuperSplatVR() || inXR) {
      exitSuperSplatVR();
      setInXR(false);
      return;
    }

    if (!vrReady || !isSuperSplatVRReady()) {
      toast.error("VR not ready", {
        description: "Wait for the reconstruction to finish loading, then try again.",
      });
      return;
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

  const label = inXR || hasActiveSuperSplatVR() ? "Exit to Browser" : "Enter XR";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!splatUrl || loadingVR}
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
