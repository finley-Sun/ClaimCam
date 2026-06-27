import { useEffect, useState } from "react";
import { Glasses, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  enterSplatXR,
  exitSplatXR,
  isSplatXRActive,
  isWebXRSupported,
  onSplatXREnd,
} from "../../../SplatManagement/splatBridge.js";

type EnterXRButtonProps = {
  splatUrl: string;
  vrReady: boolean;
};

export function EnterXRButton({ splatUrl, vrReady }: EnterXRButtonProps) {
  const [inXR, setInXR] = useState(isSplatXRActive());
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    onSplatXREnd(() => {
      setInXR(false);
      setEntering(false);
    });
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
        description: "Wait until the reconstruction appears, then tap Enter VR.",
      });
      return;
    }

    if (!isWebXRSupported()) {
      toast.error("VR unavailable", {
        description: "Use Quest Browser over HTTPS.",
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
      toast.error("Could not enter VR", {
        description: "Try again from Quest Browser over HTTPS.",
      });
    }
  };

  const label =
    inXR || isSplatXRActive()
      ? "Exit VR"
      : entering
        ? "Entering VR…"
        : "Enter VR";

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
