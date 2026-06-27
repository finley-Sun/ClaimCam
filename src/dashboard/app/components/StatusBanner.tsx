import { Home, Building2, MapPin, RefreshCw, Shield, Pencil, Clock } from "lucide-react";
import { USER_PROFILES, PLANS, type UserType } from "./data";

type StatusBannerProps = {
  userType: UserType;
  onSwitchPortal: () => void;
  totalDocumented: number;
};

const money = (n: number) => `$${n.toLocaleString()}`;

export function StatusBanner({ userType, onSwitchPortal, totalDocumented }: StatusBannerProps) {
  const profile = USER_PROFILES[userType];
  const plan = PLANS[userType];
  const Icon = userType === "homeowner" ? Home : Building2;

  const belongingsLimit = userType === "homeowner" ? 40000 : 20000;
  const structureDocumented = userType === "homeowner" ? 5760 : 0;
  const structureLimit = userType === "homeowner" ? 450000 : 0;
  const structurePct = Math.min((structureDocumented / structureLimit) * 100, 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Property info card */}
      <div className="rounded-2xl bg-[#1B1E21] p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#66371C]">
              <Icon className="size-5 text-[#FFA16C]" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">House No. 2847</p>
              <span className="mt-0.5 inline-block rounded-lg border border-[#363C43] bg-[#363C43] px-2 py-0.5 text-[11px] text-[#B2BBC6]">
                {profile.label}
              </span>
            </div>
          </div>
          <button
            onClick={onSwitchPortal}
            className="flex items-center gap-1 rounded-full bg-[#FF8A47] px-2 py-1 text-[11px] text-white transition-colors hover:bg-[#FFA16C] active:bg-[#CC6E39]"
          >
            <RefreshCw className="size-3" />
            Switch property
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-[#9CA8B7]">
          <MapPin className="size-3 shrink-0" />
          <span>2847 Griffith Park Blvd, Los Angeles, CA 90027</span>
        </div>
      </div>

      {/* Coverage status card */}
      <div className="rounded-2xl bg-[#1B1E21] p-3">
        <p className="text-[11px] text-[#8695A7]">Coverage status</p>
        <div className="mt-2 flex flex-col gap-3">
          {/* Belongings */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white">Belongings</p>
              <span className="rounded-lg border border-[#37865F] bg-[#122D20] px-2 py-0.5 text-[11px] text-[#7AE3AF]">
                Within coverage
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold tabular-nums text-white">$15,128</span>
              <span className="text-xs text-[#9CA8B7]">documented · {money(belongingsLimit)} limit</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#363C43]">
              <div
                className="h-full rounded-full bg-[#ff8a47] transition-all"
                style={{ width: "38%" }}
              />
            </div>
          </div>

          {userType === "homeowner" && (
            <>
              <div className="h-px bg-[#2A2F35]" />
              {/* Structure */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white">Structure</p>
                  <span className="flex items-center gap-1 rounded-lg border border-white/20 px-2 py-0.5 text-[11px] text-[#DFE2E5] transition-colors hover:border-white/30 hover:bg-[#363C43] hover:text-white active:border-white/35 active:bg-[#505964] active:text-white">
                    <Pencil className="size-2.5" />
                    Keep documenting
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold tabular-nums text-white">{money(structureDocumented)}</span>
                  <span className="text-xs text-[#9CA8B7]">documented · {money(structureLimit)} limit</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#363C43]">
                  <div
                    className="h-full rounded-full bg-[#ff8a47] transition-all"
                    style={{ width: `${structurePct}%` }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-[#2A2F35]" />
          <div className="flex items-center justify-between text-[11px] text-[#9CA8B7]">
            <span>4 rooms · 6 items</span>
            <span className="flex items-center gap-1"><Clock className="size-3" />Updated 1 month ago</span>
          </div>
          <p className="text-[10px] text-[#6B7786]">
            Reflects documented items only — your full value may be higher.
          </p>
        </div>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl bg-[#1B1E21] p-3">
        <p className="text-[11px] text-[#8695A7]">Current plan</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-medium text-white">{plan.name}</p>
          <Shield className="size-5 text-[#6B7786]" />
        </div>
        <div className="mt-2 h-px bg-[#2A2F35]" />
        <div className="mt-2 flex items-start justify-between text-[11px] text-[#6B7786]">
          <div className="flex flex-col gap-1">
            <span>Policy #{plan.policyNo.split("-").slice(-2).join("-")}</span>
            <span>Renews {new Date(plan.renewal).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          </div>
          <span>$2,200 / year</span>
        </div>
      </div>
    </div>
  );
}
