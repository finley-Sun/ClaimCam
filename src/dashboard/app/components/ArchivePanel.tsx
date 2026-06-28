import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { Plus, X, Package, FileStack, GitCompareArrows, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ItemArchiveCard } from "./ItemArchiveCard";
import { StatusBanner } from "./StatusBanner";
import { StructureList } from "./StructureList";
import { ConditionCompare } from "./ConditionCompare";
import { SceneLiability } from "./SceneLiability";
import { CreationFlowModal, type FlowMode } from "./flows/CreationFlowModal";
import { cn } from "./ui/utils";
import { getRoomsByUser, type Room, type UserType } from "./data";

type ArchivePanelProps = {
    open: boolean;
    room: Room;
    userType: UserType;
    onSwitchPortal: () => void;
    highlightedItemId: string | null;
    onHighlight: (itemId: string) => void;
    onClose: () => void;
    onFlowOpenChange?: (open: boolean) => void;
};

export function ArchivePanel({
    open,
    room,
    userType,
    onSwitchPortal,
    highlightedItemId,
    onHighlight,
    onClose,
    onFlowOpenChange,
}: ArchivePanelProps) {
    const [belongingsTab, setBelongingsTab] = useState<"belongings" | "structure">("belongings");
    const [flowOpen, setFlowOpen] = useState(false);
    const [flowMode, setFlowMode] = useState<FlowMode>("item");

    useEffect(() => {
        onFlowOpenChange?.(flowOpen);
    }, [flowOpen, onFlowOpenChange]);

    const isExterior = room.kind === "exterior";

    const allRooms = getRoomsByUser(userType);
    const totalDocumented = allRooms
        .flatMap((r) => r.items)
        .reduce((s, i) => s + i.replacementValue, 0);

    const itemList = (
        <div className="flex flex-col gap-3">
            {room.items.map((item) => (
                <ItemArchiveCard
                    key={item.id}
                    item={item}
                    isHighlighted={highlightedItemId === item.id}
                    onHighlight={() => onHighlight(item.id)}
                />
            ))}
            {room.items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-sm text-white/40">
                    No items documented in this scene yet.
                </div>
            )}
        </div>
    );

    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 416, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="relative h-full shrink-0 overflow-hidden"
                    style={{ background: "#0D0F11" }}
                >
                    <div className="flex h-full w-[416px] flex-col">
                        {/* Pinned header */}
                        <div className="flex shrink-0 items-center justify-between px-4 py-4">
                            <h2
                                className="text-2xl font-medium text-white"
                                style={{ fontFamily: "var(--font-body)" }}
                            >
                                Archive
                            </h2>
                            <button
                                onClick={onClose}
                                className="flex size-6 items-center justify-center rounded-md text-[#c9cfd6] transition-colors hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <ScrollArea className="min-h-0 flex-1">
                            <div className="flex flex-col gap-4 px-4 pb-8">
                                {/* Hero cards: property info + coverage + plan */}
                                <StatusBanner
                                    userType={userType}
                                    onSwitchPortal={onSwitchPortal}
                                    totalDocumented={totalDocumented}
                                />

                                {/* Room section */}
                                <div className="flex flex-col gap-3">
                                    {/* Room heading */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-[#8695A7]">
                                                Currently viewing
                                            </p>
                                            <h3 className="text-lg font-semibold text-white">
                                                {room.name}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (belongingsTab === "structure") {
                                                    setFlowMode("document");
                                                } else {
                                                    setFlowMode("item");
                                                }
                                                setFlowOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 rounded-full bg-[#FF8A47] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#FFA16C] active:bg-[#CC6E39]"
                                        >
                                            <Plus className="size-4" />
                                            {belongingsTab === "structure"
                                                ? "Document structure"
                                                : "Add item"}
                                        </button>
                                    </div>

                                    {/* Scene-scoped tabs / toggle */}
                                    {userType === "tenant" ? (
                                        <Tabs defaultValue="belongings" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="belongings" className="gap-1.5">
                                                    <Package className="size-3.5" /> Belongings
                                                </TabsTrigger>
                                                <TabsTrigger value="condition" className="gap-1.5">
                                                    <GitCompareArrows className="size-3.5" />{" "}
                                                    Condition
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="belongings" className="mt-3">
                                                {itemList}
                                            </TabsContent>
                                            <TabsContent value="condition" className="mt-3">
                                                <ConditionCompare records={room.condition} />
                                            </TabsContent>
                                        </Tabs>
                                    ) : isExterior ? (
                                        <Tabs defaultValue="liability" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="liability" className="gap-1.5">
                                                    <ShieldAlert className="size-3.5" /> Liability
                                                </TabsTrigger>
                                                <TabsTrigger value="structure" className="gap-1.5">
                                                    <FileStack className="size-3.5" /> Structure
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="liability" className="mt-3">
                                                <SceneLiability room={room} />
                                            </TabsContent>
                                            <TabsContent value="structure" className="mt-3">
                                                <StructureList
                                                    records={room.structure}
                                                    sceneName={room.name}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    ) : (
                                        /* Homeowner interior: segmented toggle */
                                        <div className="flex flex-col gap-3">
                                            <div className="flex rounded-full bg-[#363C43] p-0.5">
                                                <button
                                                    onClick={() => setBelongingsTab("belongings")}
                                                    className={cn(
                                                        "flex flex-1 items-center justify-center rounded-full px-3 py-2 text-xs transition-colors",
                                                        belongingsTab === "belongings"
                                                            ? "bg-[#FF8A47] text-white"
                                                            : "text-[#9CA8B7] hover:bg-[#505964] hover:text-[#C9CFD6]",
                                                    )}
                                                >
                                                    Personal Belongings
                                                </button>
                                                <button
                                                    onClick={() => setBelongingsTab("structure")}
                                                    className={cn(
                                                        "flex flex-1 items-center justify-center rounded-full px-3 py-2 text-xs transition-colors",
                                                        belongingsTab === "structure"
                                                            ? "bg-[#FF8A47] text-white"
                                                            : "text-[#9CA8B7] hover:bg-[#505964] hover:text-[#C9CFD6]",
                                                    )}
                                                >
                                                    Dwelling Structure
                                                </button>
                                            </div>

                                            {belongingsTab === "belongings" ? (
                                                itemList
                                            ) : (
                                                <StructureList
                                                    records={room.structure}
                                                    sceneName={room.name}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Creation flow modal */}
                    <CreationFlowModal
                        open={flowOpen}
                        mode={flowMode}
                        targetRoom={room}
                        onClose={() => setFlowOpen(false)}
                        onCompleteItem={(item) => {
                            room.items.push(item);
                            toast("Item added", {
                                description: `"${item.name}" registered in ${room.name}.`,
                            });
                        }}
                        onCompleteDocument={(file) => {
                            toast("Document uploaded", {
                                description: `"${file.name}" attached (mock).`,
                            });
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}