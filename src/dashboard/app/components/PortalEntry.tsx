import { motion } from "motion/react";
import { Home, Building2, ArrowRight, Boxes, FileStack, ShieldAlert, GitCompareArrows, Package } from "lucide-react";
import logo from "/textures/logo-onWhite.png";
import type { UserType } from "./data";

type PortalEntryProps = {
  onSelect: (type: UserType) => void;
};

const PORTALS: {
  type: UserType;
  title: string;
  icon: typeof Home;
  blurb: string;
  features: { icon: typeof Boxes; label: string }[];
}[] = [
  {
    type: "homeowner",
    title: "Owner Portal",
    icon: Home,
    blurb: "Protect your belongings, structure, and grounds — built around rebuild cost and liability.",
    features: [
      { icon: Package, label: "Insured belongings" },
      { icon: FileStack, label: "Structure & rebuild value" },
      { icon: ShieldAlert, label: "Grounds & liability scenes" },
    ],
  },
  {
    type: "tenant",
    title: "Tenant Portal",
    icon: Building2,
    blurb: "Document your personal belongings and compare move-in vs move-out condition to protect your deposit.",
    features: [
      { icon: Package, label: "Personal belongings" },
      { icon: GitCompareArrows, label: "Move-in / move-out compare" },
      { icon: Boxes, label: "Fast, evidence-backed claims" },
    ],
  },
];

export function PortalEntry({ onSelect }: PortalEntryProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 px-6 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex flex-col items-center text-center"
      >
        <img src={logo} alt="ClaimCam" className="h-9 w-auto object-contain" />
        <h1 className="mt-5 text-2xl">Choose your portal</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          ClaimCam tailors your archive to how you're covered. Pick the experience that fits you.
        </p>
      </motion.div>

      <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        {PORTALS.map((portal, i) => {
          const Icon = portal.icon;
          return (
            <motion.button
              key={portal.type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 * (i + 1) }}
              onClick={() => onSelect(portal.type)}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-[0_20px_50px_-20px_var(--brand-glow)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-6" />
                </span>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 text-lg">{portal.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{portal.blurb}</p>
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {portal.features.map((f) => {
                  const FIcon = f.icon;
                  return (
                    <div key={f.label} className="flex items-center gap-2 text-sm text-foreground/80">
                      <FIcon className="size-4 text-primary" />
                      {f.label}
                    </div>
                  );
                })}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
