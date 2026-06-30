import { useState, useRef, useCallback } from "react";
import { X, Upload, Video, Check, Flame } from "lucide-react";

// ─── Damage types ───────────────────────────────────────────────────────────

const DAMAGE_TYPES = [
    { value: "fire", label: "Fire", icon: "🔥" },
    { value: "water", label: "Water", icon: "💧" },
    { value: "theft", label: "Theft", icon: "🔒" },
    { value: "natural", label: "Natural disaster", icon: "🌪️" },
    { value: "glass", label: "Glass breakage", icon: "🪟" },
    { value: "other", label: "Other", icon: "⚠️" },
] as const;

// ─── Media ──────────────────────────────────────────────────────────────────

type MediaItem = { file: File; url: string; type: "image" | "video" };

// ─── Props ──────────────────────────────────────────────────────────────────

type ClaimFlowModalProps = {
    open: boolean;
    onClose: () => void;
    onComplete?: (claim: ClaimDraft) => void;
};

export type ClaimDraft = {
    damageType: string;
    incidentDate: string;
    description: string;
    media: MediaItem[];
};

// ─── Component ──────────────────────────────────────────────────────────────

export function ClaimFlowModal({ open, onClose, onComplete }: ClaimFlowModalProps) {
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // ── Draft ──
    const [damageType, setDamageType] = useState("");
    const [incidentDate, setIncidentDate] = useState("");
    const [description, setDescription] = useState("");

    // ── Media ──
    const [media, setMedia] = useState<MediaItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Generation ──
    const [generating, setGenerating] = useState<"idle" | "loading" | "done">("idle");
    const [genStatus, setGenStatus] = useState("");

    const mediaScore = media.reduce((s, m) => s + (m.type === "video" ? 5 : 1), 0);
    const mediaSatisfied = mediaScore >= 15;

    function addFiles(files: FileList | File[]) {
        const items: MediaItem[] = Array.from(files).map((f) => ({
            file: f,
            url: URL.createObjectURL(f),
            type: f.type.startsWith("video") ? "video" : "image",
        }));
        setMedia((prev) => [...prev, ...items]);
    }

    function removeMedia(i: number) {
        setMedia((prev) => prev.filter((_, idx) => idx !== i));
    }

    const resetAndClose = useCallback(() => {
        setStep(1);
        setDamageType("");
        setIncidentDate("");
        setDescription("");
        setMedia([]);
        setGenerating("idle");
        setGenStatus("");
        onClose();
    }, [onClose]);

    async function mockGenerate() {
        setGenerating("loading");
        const steps = [
            { label: "Uploading damage evidence...", duration: 1200 },
            { label: "Analysing frames...", duration: 1500 },
            { label: "Training damage model...", duration: 2000 },
            { label: "Finalising reconstruction...", duration: 1000 },
        ];
        for (const s of steps) {
            setGenStatus(s.label);
            await new Promise((r) => setTimeout(r, s.duration));
        }
        setGenerating("done");
    }

    function handleFinalSubmit() {
        const draft: ClaimDraft = {
            damageType,
            incidentDate,
            description,
            media,
        };
        onComplete?.(draft);
        resetAndClose();
    }

    if (!open) return null;

    return (
        <Overlay onBgClick={resetAndClose}>
            {/* ── Step 1: Incident details ────────────────────── */}
            {step === 1 && (
                <>
                    <Header
                        stepLabel={`Step 1 of ${totalSteps}`}
                        title="Report incident"
                        onClose={resetAndClose}
                    />
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Type of damage
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {DAMAGE_TYPES.map((dt) => (
                                    <button
                                        key={dt.value}
                                        onClick={() => setDamageType(dt.value)}
                                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-colors ${
                                            damageType === dt.value
                                                ? "border-destructive bg-destructive/10 text-foreground"
                                                : "border-border text-muted-foreground hover:border-destructive/40"
                                        }`}
                                    >
                                        <span>{dt.icon}</span>
                                        <span>{dt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Incident date
                            </label>
                            <input
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                type="date"
                                value={incidentDate}
                                onChange={(e) => setIncidentDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Description
                            </label>
                            <textarea
                                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                rows={3}
                                placeholder="Describe what happened..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <Footer
                        onBack={resetAndClose}
                        backLabel="Cancel"
                        onNext={() => {
                            if (!damageType) return;
                            if (!incidentDate) return;
                            setStep(2);
                        }}
                    />
                </>
            )}

            {/* ── Step 2: Media upload ────────────────────────── */}
            {step === 2 && (
                <>
                    <Header
                        stepLabel={`Step 2 of ${totalSteps}`}
                        title="Upload damage evidence"
                        onClose={resetAndClose}
                    />
                    <div className="mt-4 space-y-4">
                        <div
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-destructive/40"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                addFiles(e.dataTransfer.files);
                            }}
                        >
                            <Upload className="size-7" />
                            <span className="text-sm">Click to upload or drag & drop</span>
                            <span className="text-xs">Photos and videos of the damage</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) addFiles(e.target.files);
                            }}
                        />

                        {/* Score bar */}
                        <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-medium">
                                    {mediaScore} / 15 points
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Images = 1 pt | Videos = 5 pts
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${Math.min((mediaScore / 15) * 100, 100)}%`,
                                        background: mediaSatisfied
                                            ? "#3a7d44"
                                            : mediaScore > 0
                                                ? "#c8860a"
                                                : "var(--border)",
                                    }}
                                />
                            </div>
                            <p
                                className="text-xs"
                                style={{
                                    color: mediaSatisfied
                                        ? "#3a7d44"
                                        : "var(--muted-foreground)",
                                }}
                            >
                                {mediaSatisfied
                                    ? "Requirement met - you can continue"
                                    : `${15 - mediaScore} more point${15 - mediaScore !== 1 ? "s" : ""} needed`}
                            </p>
                        </div>

                        {/* Thumbnails */}
                        {media.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {media.map((item, i) => (
                                    <div
                                        key={i}
                                        className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                                    >
                                        {item.type === "video" ? (
                                            <video
                                                src={item.url}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={item.url}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                                            {item.type === "video" ? "5pts" : "1pt"}
                                        </span>
                                        <button
                                            onClick={() => removeMedia(i)}
                                            className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:block"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Footer
                        onBack={() => setStep(1)}
                        onNext={() => {
                            if (mediaSatisfied) setStep(3);
                        }}
                        nextDisabled={!mediaSatisfied}
                    />
                </>
            )}

            {/* ── Step 3: Generate damage reconstruction ─────── */}
            {step === 3 && (
                <>
                    <Header
                        stepLabel={`Step 3 of ${totalSteps}`}
                        title="Generate damage reconstruction"
                        onClose={resetAndClose}
                    />
                    <div className="mt-6 flex flex-col items-center gap-3 py-6">
                        {generating === "idle" && (
                            <>
                                <Flame className="size-10 text-destructive" />
                                <span className="text-sm font-medium">
                                    Ready to generate damage reconstruction
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {media.length} media file{media.length !== 1 ? "s" : ""} uploaded
                                </span>
                                <button
                                    onClick={mockGenerate}
                                    className="mt-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                                >
                                    Generate reconstruction
                                </button>
                            </>
                        )}
                        {generating === "loading" && (
                            <>
                                <div className="size-8 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                                <span className="text-sm font-medium">{genStatus}</span>
                                <span className="text-xs text-muted-foreground">
                                    This may take a few minutes
                                </span>
                            </>
                        )}
                        {generating === "done" && (
                            <>
                                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                                    <Check className="size-5" />
                                </div>
                                <span className="text-sm font-medium">
                                    Damage reconstruction ready
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {DAMAGE_TYPES.find((d) => d.value === damageType)?.label} - {incidentDate}
                                </span>
                            </>
                        )}
                    </div>
                    {generating === "idle" && (
                        <Footer onBack={() => setStep(2)} nextLabel="" />
                    )}
                    {generating === "done" && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleFinalSubmit}
                                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                            >
                                Submit claim
                            </button>
                        </div>
                    )}
                </>
            )}
        </Overlay>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Overlay({ children, onBgClick }: { children: React.ReactNode; onBgClick: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onBgClick();
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
        >
            <div className="relative w-full max-w-lg rounded-2xl border border-[var(--surface-glass-border)] bg-[var(--surface-glass-strong)] p-6 shadow-2xl backdrop-blur-xl">
                {children}
            </div>
        </div>
    );
}

function Header({
    stepLabel,
    title,
    onClose,
}: {
    stepLabel: string;
    title: string;
    onClose: () => void;
}) {
    return (
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs text-muted-foreground">{stepLabel}</p>
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <button
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <X className="size-4" />
            </button>
        </div>
    );
}

function Footer({
    onBack,
    onNext,
    backLabel = "Back",
    nextLabel = "Continue",
    nextDisabled = false,
}: {
    onBack?: () => void;
    onNext?: () => void;
    backLabel?: string;
    nextLabel?: string;
    nextDisabled?: boolean;
}) {
    return (
        <div className="mt-6 flex justify-between">
            {onBack && (
                <button
                    onClick={onBack}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                    {backLabel}
                </button>
            )}
            {nextLabel && onNext && (
                <button
                    onClick={onNext}
                    disabled={nextDisabled}
                    className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {nextLabel}
                </button>
            )}
        </div>
    );
}