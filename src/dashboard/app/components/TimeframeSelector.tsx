import { ChevronDown, Plus, Calendar, Flame, Camera, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
};

export function TimeframeSelector({ logs, activeLogId, onSelect }: TimeframeSelectorProps) {
  const active = logs.find((l) => l.id === activeLogId) ?? logs[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-[var(--surface-glass-border)] bg-[var(--surface-glass-strong)] py-2 pl-3 pr-3.5 text-sm text-foreground backdrop-blur-xl transition-colors hover:border-primary/40">
        <Calendar className="size-4 text-muted-foreground" />
        <span className="tabular-nums">{active.date}</span>
        {active.phase && <PhasePill phase={active.phase} />}
        {active.type === "damage" && <Flame className="size-3.5 text-destructive" />}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {logs.map((log) => (
          <DropdownMenuItem
            key={log.id}
            onClick={() => onSelect(log.id)}
            className="gap-2.5"
          >
            {log.type === "damage" ? (
              <Flame className="size-4 text-destructive" />
            ) : (
              <Camera className="size-4 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <span className="tabular-nums leading-tight">{log.date}</span>
              <span className="text-xs text-muted-foreground leading-tight">{log.label}</span>
            </div>
            {log.phase && (
              <span className="ml-auto">
                <PhasePill phase={log.phase} />
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            toast("Start a new capture", {
              description: "Record a fresh video walkthrough to generate new splats.",
            })
          }
          className="gap-2.5 text-primary focus:text-primary"
        >
          <Plus className="size-4" />
          <span>Add new capture</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
