import { useEffect, useState } from "react";
import { Glasses } from "lucide-react";
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

  useEffect(() => {
    onSplatXREnd(() => setInXR(false));
  }, []);

  const handleClick = () => {
    if (inXR || isSplatXRActive()) {
      exitSplatXR();
      setInXR(false);
      return;
    }

    if (!vrReady) {
      toast.error("Scene not ready", {
        description: "Wait for the reconstruction to appear first.",
      });
      return;
    }

    if (!isWebXRSupported()) {
      toast.error("VR unavailable", {
        description: "Use a WebXR-capable browser on HTTPS (e.g. Quest Browser).",
      });
      return;
    }

    try {
      // Uses the same loaded splat — requestSession must run from this click.
      enterSplatXR();
      setInXR(true);
    } catch (err) {
      console.error("[EnterXR] failed:", err);
      toast.error("Could not enter VR", {
        description: "Try again from the headset browser over HTTPS.",
      });
    }
  };

  const label = inXR || isSplatXRActive() ? "Exit VR" : "Enter VR";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!splatUrl || !vrReady}
      className="group flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-[0_12px_36px_-10px_var(--brand-glow)] transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
    >
      <Glasses className="size-5" />
      <span>{label}</span>
    </button>
  );
}
