import { FileText, Image as ImageIcon, MapPin, Clock } from "lucide-react";
import { Progress } from "./ui/progress";
import { cn } from "./ui/utils";
import { CLAIMS, type Claim } from "./data";

const STATUS: Record<Claim["status"], { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-green-500/15 text-green-400" },
  approved: { label: "Approved", className: "bg-primary/15 text-primary" },
  in_review: { label: "In Review", className: "bg-amber-500/15 text-amber-400" },
  submitted: { label: "Submitted", className: "bg-sky-500/15 text-sky-400" },
};

const money = (n: number) => `$${n.toLocaleString()}`;

export function ClaimsView() {
  // Most recent first.
  const claims = [...CLAIMS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-4xl px-8 py-10">
        <header className="mb-8">
          <p className="text-sm text-muted-foreground">Claims archive</p>
          <h1 className="text-3xl">Your Claims</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every claim you've filed, with its supporting splat evidence and live progress —
            ordered chronologically.
          </p>
        </header>

        {/* Timeline of claims */}
        <div className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {claims.map((claim) => {
            const status = STATUS[claim.status];
            return (
              <div key={claim.id} className="relative pl-8">
                <span className="absolute left-0 top-3 size-3.5 rounded-full border-2 border-primary bg-background" />
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-primary" />
                        <h3 className="text-base">{claim.title}</h3>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {claim.room}
                        </span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <Clock className="size-3" /> {claim.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <ImageIcon className="size-3" /> {claim.evidenceCount} evidence files
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-right text-sm tabular-nums">{money(claim.amount)}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{claim.description}</p>

                  {/* Evidence thumbnails */}
                  <div className="mt-4 flex gap-2">
                    {Array.from({ length: Math.min(claim.evidenceCount, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="flex h-12 w-16 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground"
                      >
                        <ImageIcon className="size-4" />
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                      <span>Claim progress</span>
                      <span className="tabular-nums">{claim.progress}%</span>
                    </div>
                    <Progress value={claim.progress} className="h-1.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
