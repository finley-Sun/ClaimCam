import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import {
    exitSplatXR,
    isSplatXRActive,
    onSplatXREnd,
    onXRStateChange,
} from "../../../SplatManagement/splatBridge.js";

export function XROverlay() {
    const [inXR, setInXR] = useState(false);

    useEffect(() => {
        // Initial check
        setInXR(isSplatXRActive());

        // Listen for state changes from the bridge
        const unsubscribe = onXRStateChange((active: boolean) => {
            setInXR(active);
        });

        // Also listen for external session end (e.g. user removed headset)
        onSplatXREnd(() => setInXR(false));

        // Polling fallback in case events are missed
        const interval = setInterval(() => {
            setInXR(isSplatXRActive());
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };  
    }, []);

    if (!inXR) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            <button
                onClick={() => {
                exitSplatXR();
                setInXR(false);
                }}
                className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-medium text-destructive-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
            <LogOut className="size-5" />
            <span>Exit VR</span>
            </button>
        </div>
    );
}