import { Home, FileText, Headset } from "lucide-react";
import { toast } from "sonner";
import { cn } from "./ui/utils";
import logo from "/textures/logo-onWhite.png";

export type PageKey = "property" | "claims";

type SidebarProps = {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
};

const NAV: { key: PageKey; label: string; icon: typeof Home }[] = [
  { key: "property", label: "Your Property", icon: Home },
  { key: "claims", label: "Your Claim", icon: FileText },
];

export function Sidebar({ page, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-[210px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center px-5 py-6">
        <img src={logo} alt="ClaimCam" className="h-7 w-auto object-contain" />
      </div>

      {/* Primary navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand-glow)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4.5" strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Contact agent (future portal) */}
      <div className="px-3 pb-5">
        <button
          onClick={() =>
            toast("Connecting you to an agent", {
              description: "AI advisor & live agent chat is coming soon.",
            })
          }
          className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5 text-left text-sm text-sidebar-foreground/80 transition-all hover:border-primary/40 hover:text-sidebar-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Headset className="size-4" />
          </span>
          <span className="leading-tight">
            Contact Agent
            <span className="block text-xs text-muted-foreground">Get advice</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
