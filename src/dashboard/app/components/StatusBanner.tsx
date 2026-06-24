import { Home, Building2, MapPin, RefreshCw } from "lucide-react";
import { USER_PROFILES, type UserType } from "./data";

type StatusBannerProps = {
  userType: UserType;
  onSwitchPortal: () => void;
};

export function StatusBanner({ userType, onSwitchPortal }: StatusBannerProps) {
  const profile = USER_PROFILES[userType];
  const Icon = userType === "homeowner" ? Home : Building2;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
              {profile.label}
            </span>
            <p className="mt-1 text-sm leading-tight">{profile.residence}</p>
          </div>
        </div>

        <button
          onClick={onSwitchPortal}
          className="flex items-center gap-1 rounded-lg border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          title="Switch portal"
        >
          <RefreshCw className="size-3" />
          Switch
        </button>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" />
        <span>{profile.address}</span>
      </div>
    </div>
  );
}
