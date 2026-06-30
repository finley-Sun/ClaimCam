import { useState, useEffect } from "react";
import { ChevronDown, Plus, Flame, Camera, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ClaimFlowModal } from "./flows/ClaimFlowModal";
import { PHASE_LABEL, type TimeframeLog } from "./data";

function PhasePill({ phase }: { phase: NonNullable<TimeframeLog["phase"]> }) {
    const Icon = phase === "move-in" ? LogIn : LogOut;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
            <Icon className="size-3" />
            {PHASE_LABEL[phase]}
        </span>
    );
}

type TimeframeSelectorProps = {
    logs: TimeframeLog[];
    activeLogId: string;
    onSelect: (logId: string) => void;
    onFlowOpenChange?: (open: boolean) => void;
};

export function TimeframeSelector({
    logs,
    activeLogId,
    onSelect,
    onFlowOpenChange,
}: TimeframeSelectorProps) {
    const [claimOpen, setClaimOpen] = useState(false);
    const active = logs.find((l) => l.id === activeLogId) ?? logs[0];

    useEffect(() => {
        onFlowOpenChange?.(claimOpen);
    }, [claimOpen, onFlowOpenChange]);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-[var(--surface-glass-border)] bg-[var(--surface-glass-strong)] py-3 pl-3 pr-3.5 text-sm text-foreground backdrop-blur-xl transition-colors hover:border-primary/40">
                    {active.type === "damage" ? (
                        <Flame className="size-4 text-destructive" />
                    ) : (
                        <Camera className="size-4 text-muted-foreground" />
                    )}
                    <span className="tabular-nums">
                        {active.type === "damage" ? "Fire damage: May 1, 2026" : "Good condition: Aug 1, 2025"}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuItem
                        onClick={() => onSelect(logs.find(l => l.type === "capture")?.id ?? logs[0].id)}
                        className="gap-2.5"
                    >
                        <Camera className="size-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="tabular-nums leading-tight">Aug 1, 2025</span>
                            <span className="text-xs text-muted-foreground leading-tight">Good condition</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onSelect(logs.find(l => l.id === "t4")?.id ?? logs[0].id)}
                        className="gap-2.5"
                    >
                        <Flame className="size-4 text-destructive" />
                        <div className="flex flex-col">
                            <span className="tabular-nums leading-tight">May 1, 2026</span>
                            <span className="text-xs text-muted-foreground leading-tight">Living room fire</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setClaimOpen(true)}
                        className="gap-2.5 text-primary focus:text-primary"
                    >
                        <Plus className="size-4" />
                        <span>Add new capture</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ClaimFlowModal
                open={claimOpen}
                onClose={() => setClaimOpen(false)}
                onComplete={(claim) => {
                    toast("Claim submitted", {
                        description: `${claim.damageType} incident on ${claim.incidentDate} recorded.`,
                    });
                }}
            />
        </>
    );
}