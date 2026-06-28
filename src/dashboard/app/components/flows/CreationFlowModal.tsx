import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, Video, Check } from "lucide-react";
import type { Room, InsuredItem } from "./data";

// ─── Flow mode ──────────────────────────────────────────────────────────────

export type FlowMode = "room" | "item" | "document";

type CreationFlowModalProps = {
    open: boolean;
    mode: FlowMode;
    targetRoom?: Room;
    onClose: () => void;
    onCompleteRoom?: (room: Room) => void;
    onCompleteItem?: (item: InsuredItem) => void;
    onCompleteDocument?: (file: File) => void;
};

// ─── Icon options for room creation ─────────────────────────────────────────

const ROOM_ICONS = [
    { value: "Sofa", label: "Living Room" },
    { value: "BedDouble", label: "Bedroom" },
    { value: "CookingPot", label: "Kitchen" },
    { value: "Bath", label: "Bathroom" },
    { value: "Briefcase", label: "Office" },
    { value: "Warehouse", label: "Garage" },
    { value: "TreePine", label: "Garden" },
    { value: "Car", label: "Driveway" },
] as const;

// ─── Item categories ────────────────────────────────────────────────────────

const ITEM_CATEGORIES = [
    "Electronics",
    "Furniture",
    "Appliance",
    "Instrument",
    "Jewelry",
    "Clothing",
    "Art",
    "Other",
];

// ─── Media ──────────────────────────────────────────────────────────────────

type MediaItem = { file: File; url: string; type: "image" | "video" };

// ─── Component ──────────────────────────────────────────────────────────────

export function CreationFlowModal({
    open,
    mode,
    targetRoom,
    onClose,
    onCompleteRoom,
    onCompleteItem,
    onCompleteDocument,
}: CreationFlowModalProps) {
    // ── Room draft ──
    const [roomName, setRoomName] = useState("");
    const [roomIcon, setRoomIcon] = useState("Sofa");
    const [roomKind, setRoomKind] = useState<"interior" | "exterior">("interior");

    // ── Item draft ──
    const [itemName, setItemName] = useState("");
    const [itemModel, setItemModel] = useState("");
    const [itemCategory, setItemCategory] = useState("Electronics");
    const [itemValue, setItemValue] = useState("");
    const [itemPurchaseDate, setItemPurchaseDate] = useState("");

    // ── Document draft ──
    const [docFile, setDocFile] = useState<File | null>(null);

    // ── Shared: receipt ──
    const [receipt, setReceipt] = useState<File | null>(null);
    const [manualValue, setManualValue] = useState("");
    const [purchaseYear, setPurchaseYear] = useState("");

    // ── Shared: media ──
    const [media, setMedia] = useState<MediaItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const receiptInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // ── Shared: generation (rooms only) ──
    const [generating, setGenerating] = useState<"idle" | "loading" | "done">("idle");
    const [genStatus, setGenStatus] = useState("");

    // ── Step management ──
    const totalSteps = mode === "document" ? 1 : mode === "item" ? 4 : 5;
    const [step, setStep] = useState(1);

    // ── Helpers ──

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
        setRoomName("");
        setRoomIcon("Sofa");
        setRoomKind("interior");
        setItemName("");
        setItemModel("");
        setItemCategory("Electronics");
        setItemValue("");
        setItemPurchaseDate("");
        setReceipt(null);
        setManualValue("");
        setPurchaseYear("");
        setMedia([]);
        setDocFile(null);
        setGenerating("idle");
        setGenStatus("");
        onClose();
    }, [onClose]);

    async function mockGenerate() {
        setGenerating("loading");
        const steps = [
            { label: "Uploading media...", duration: 1200 },
            { label: "Processing frames...", duration: 1500 },
            { label: "Training Gaussian model...", duration: 2000 },
            { label: "Finalising splat...", duration: 1000 },
        ];
        for (const s of steps) {
            setGenStatus(s.label);
            await new Promise((r) => setTimeout(r, s.duration));
        }
        setGenerating("done");
    }

    function handleFinalSubmit() {
        if (mode === "room") {
            const newRoom: Room = {
                id: `room-${Date.now()}`,
                name: roomName,
                icon: roomIcon,
                kind: roomKind,
                items: [],
                structure: [],
                condition: [],
            };
            onCompleteRoom?.(newRoom);
        } else if (mode === "item") {
            const newItem: InsuredItem = {
                id: `item-${Date.now()}`,
                name: itemName,
                model: itemModel,
                marketValue: Number(itemValue) * 0.7,
                replacementValue: Number(itemValue),
                coverage: Number(itemValue) * 0.85,
                category: itemCategory,
                hasEvidence: media.length > 0,
                purchaseDate: itemPurchaseDate || undefined,
                marker: { x: 0.5, y: 0.5 },
            };
            onCompleteItem?.(newItem);
        }
        resetAndClose();
    }

    if (!open) return null;

    // ─── DOCUMENT MODE (single step) ───────────────────────────────────────

    if (mode === "document") {
        return (
            <Overlay onBgClick={resetAndClose}>
                <Header
                    stepLabel="Upload document"
                    title="Add structural document"
                    onClose={resetAndClose}
                />
                <div className="mt-4 space-y-4">
                    {!docFile && (
                        <div
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary/40"
                            onClick={() => docInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files[0]) setDocFile(e.dataTransfer.files[0]);
                            }}
                        >
                            <FileText className="size-7" />
                            <span className="text-sm">Upload a document</span>
                            <span className="text-xs">PDF, JPG, PNG or DOCX</span>
                        </div>
                    )}
                    <input
                        ref={docInputRef}
                        type="file"
                        accept=".pdf,.docx,image/*"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) setDocFile(e.target.files[0]);
                        }}
                    />
                    {docFile && (
                        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                            <span className="truncate text-sm">{docFile.name}</span>
                            <button
                                onClick={() => setDocFile(null)}
                                className="ml-2 text-muted-foreground hover:text-destructive"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={resetAndClose}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (docFile) onCompleteDocument?.(docFile);
                            resetAndClose();
                        }}
                        disabled={!docFile}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Upload
                    </button>
                </div>
            </Overlay>
        );
    }

    // ─── ROOM / ITEM MODE ──────────────────────────────────────────────────

    const labels = mode === "room"
        ? { s1Title: "New room", s1Field: "Room name", s1Placeholder: "e.g. Living Room, Garage..." }
        : { s1Title: "New item", s1Field: "Item name", s1Placeholder: "e.g. OLED Television, Piano..." };

    return (
        <Overlay onBgClick={resetAndClose}>
            {/* ── Step 1: Basic info ─────────────────────────────── */}
            {step === 1 && (
                <>
                    <Header
                        stepLabel={`Step 1 of ${totalSteps}`}
                        title={labels.s1Title}
                        onClose={resetAndClose}
                    />
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                {labels.s1Field}
                            </label>
                            <input
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                placeholder={labels.s1Placeholder}
                                value={mode === "room" ? roomName : itemName}
                                onChange={(e) =>
                                    mode === "room"
                                        ? setRoomName(e.target.value)
                                        : setItemName(e.target.value)
                                }
                            />
                        </div>

                        {mode === "room" && (
                            <>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Icon
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ROOM_ICONS.map((ic) => (
                                            <button
                                                key={ic.value}
                                                onClick={() => setRoomIcon(ic.value)}
                                                className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                                                    roomIcon === ic.value
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border text-muted-foreground hover:border-primary/40"
                                                }`}
                                            >
                                                {ic.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Type
                                    </label>
                                    <div className="flex gap-2">
                                        {(
                                            [
                                                ["interior", "Interior"],
                                                ["exterior", "Exterior / Grounds"],
                                            ] as const
                                        ).map(([val, label]) => (
                                            <button
                                                key={val}
                                                onClick={() => setRoomKind(val)}
                                                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                    roomKind === val
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border text-muted-foreground hover:border-primary/40"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {mode === "item" && (
                            <>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Model / serial
                                    </label>
                                    <input
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                        placeholder="e.g. LG C3 65&quot; OLED"
                                        value={itemModel}
                                        onChange={(e) => setItemModel(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Category
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ITEM_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setItemCategory(cat)}
                                                className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                                                    itemCategory === cat
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border text-muted-foreground hover:border-primary/40"
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <Footer
                        onBack={resetAndClose}
                        backLabel="Cancel"
                        onNext={() => {
                            if (mode === "room" && !roomName.trim()) return;
                            if (mode === "item" && !itemName.trim()) return;
                            setStep(2);
                        }}
                    />
                </>
            )}

            {/* ── Step 2: Purchase receipt ───────────────────────── */}
            {step === 2 && (
                <>
                    <Header
                        stepLabel={`Step 2 of ${totalSteps}`}
                        title="Purchase receipt"
                        onClose={resetAndClose}
                    />
                    <div className="mt-4 space-y-4">
                        {!receipt && (
                            <>
                                <div
                                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary/40"
                                    onClick={() => receiptInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files[0]) {
                                            setReceipt(e.dataTransfer.files[0]);
                                        }
                                    }}
                                >
                                    <FileText className="size-7" />
                                    <span className="text-sm">Upload a purchase receipt</span>
                                    <span className="text-xs">PDF, JPG or PNG</span>
                                </div>
                                <input
                                    ref={receiptInputRef}
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) setReceipt(e.target.files[0]);
                                    }}
                                />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="h-px flex-1 bg-border" />
                                    or enter details manually
                                    <span className="h-px flex-1 bg-border" />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                            {mode === "room" ? "Estimated value (EUR)" : "Replacement value (EUR)"}
                                        </label>
                                        <input
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="e.g. 1200.00"
                                            value={manualValue}
                                            onChange={(e) => setManualValue(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                            Purchase year
                                        </label>
                                        <input
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                            type="number"
                                            min="1900"
                                            max={new Date().getFullYear()}
                                            placeholder="e.g. 2022"
                                            value={purchaseYear}
                                            onChange={(e) => setPurchaseYear(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        {receipt && (
                            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                                <span className="truncate text-sm">{receipt.name}</span>
                                <button
                                    onClick={() => setReceipt(null)}
                                    className="ml-2 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <Footer
                        onBack={() => setStep(1)}
                        onNext={() => {
                            if (receipt) {
                                setStep(3);
                                return;
                            }
                            if (!manualValue || Number(manualValue) <= 0) return;
                            if (
                                !purchaseYear ||
                                Number(purchaseYear) < 1900 ||
                                Number(purchaseYear) > new Date().getFullYear()
                            ) return;
                            if (mode === "item") {
                                setItemValue(manualValue);
                                setItemPurchaseDate(purchaseYear);
                            }
                            setStep(3);
                        }}
                    />
                </>
            )}

            {/* ── Step 3: Details (pass-through) ─────────────────── */}
            {step === 3 && (
                <>
                    <Header
                        stepLabel={`Step 3 of ${totalSteps}`}
                        title={mode === "room" ? "Room details" : "Coverage details"}
                        onClose={resetAndClose}
                    />
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                            {mode === "room"
                                ? "Optional details will be added after the room is captured. Proceed to media upload."
                                : "Additional coverage options can be configured after the item is registered. Proceed to media upload."}
                        </p>
                    </div>
                    <Footer onBack={() => setStep(2)} onNext={() => setStep(4)} />
                </>
            )}

            {/* ── Step 4: Media upload ───────────────────────────── */}
            {step === 4 && (
                <>
                    <Header
                        stepLabel={`Step 4 of ${totalSteps}`}
                        title="Add media"
                        onClose={resetAndClose}
                    />
                    <div className="mt-4 space-y-4">
                        <div
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary/40"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                addFiles(e.dataTransfer.files);
                            }}
                        >
                            <Upload className="size-7" />
                            <span className="text-sm">Click to upload or drag & drop</span>
                            <span className="text-xs">Images and videos supported</span>
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

                        {/* Score bar - rooms only */}
                        {mode === "room" && (
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
                        )}

                        {/* Simple file count - items only */}
                        {mode === "item" && media.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {media.length} file{media.length !== 1 ? "s" : ""} added
                            </p>
                        )}

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
                                        {mode === "room" && (
                                            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                                                {item.type === "video" ? "5pts" : "1pt"}
                                            </span>
                                        )}
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
                        onBack={() => setStep(3)}
                        onNext={() => {
                            if (mode === "room") {
                                if (mediaSatisfied) setStep(5);
                            } else {
                                handleFinalSubmit();
                            }
                        }}
                        nextDisabled={mode === "room" ? !mediaSatisfied : media.length === 0}
                        nextLabel={mode === "room" ? "Continue" : "Add to archive"}
                    />
                </>
            )}

            {/* ── Step 5: Splat generation (rooms only) ──────────── */}
            {step === 5 && mode === "room" && (
                <>
                    <Header
                        stepLabel={`Step 5 of ${totalSteps}`}
                        title="Generate reconstruction"
                        onClose={resetAndClose}
                    />
                    <div className="mt-6 flex flex-col items-center gap-3 py-6">
                        {generating === "idle" && (
                            <>
                                <Video className="size-10 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    Ready to generate your 3D reconstruction
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {media.length} media file{media.length !== 1 ? "s" : ""} uploaded
                                </span>
                                <button
                                    onClick={mockGenerate}
                                    className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Generate splat
                                </button>
                            </>
                        )}
                        {generating === "loading" && (
                            <>
                                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                                    Reconstruction ready
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {roomName}
                                </span>
                            </>
                        )}
                    </div>
                    {generating === "idle" && (
                        <Footer onBack={() => setStep(4)} nextLabel="" />
                    )}
                    {generating === "done" && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleFinalSubmit}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Add room
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