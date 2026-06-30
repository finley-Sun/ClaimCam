import { useState } from "react";
import { Archive } from "lucide-react";
import { SplatRenderer } from "./SplatRenderer";
import { RoomSwitcher } from "./RoomSwitcher";
import { TimeframeSelector } from "./TimeframeSelector";
import { ArchivePanel } from "./ArchivePanel";
import { EnterXRButton } from "./EnterXRButton";
import { XROverlay } from "./XROverlay";
import { cn } from "./ui/utils";
import { getRoomsByUser, LOGS_BY_USER, type Room, type TimeframeLog, type UserType } from "./data";
import { resolveSplatUrl } from "../../lib/splatUrls";

type PropertyViewProps = {
    userType: UserType;
    onSwitchPortal: () => void;
    activeRoomId: string;
    onRoomChange: (id: string) => void;
    activeLogId: string;
    onLogChange: (id: string) => void;
    archiveOpen: boolean;
    onToggleArchive: () => void;
    highlightedItemId: string | null;
    onHighlight: (id: string) => void;
};

export function PropertyView({
    userType,
    onSwitchPortal,
    activeRoomId,
    onRoomChange,
    activeLogId,
    onLogChange,
    archiveOpen,
    onToggleArchive,
    highlightedItemId,
    onHighlight,
}: PropertyViewProps) {
    const [rooms, setRooms] = useState<Room[]>(() => getRoomsByUser(userType));
    const room: Room = rooms.find((r) => r.id === activeRoomId) ?? rooms[0];
    const logs = LOGS_BY_USER[userType];
    const log: TimeframeLog = logs.find((l) => l.id === activeLogId) ?? logs[0];
    const isDamage = log.type === "damage";
    const splatUrl = resolveSplatUrl(room.id, log.type);
    const [splatReady, setSplatReady] = useState(false);

    /* Track whether any modal is open to disable renderer controls */
    const [roomFlowOpen, setRoomFlowOpen] = useState(false);
    const [archiveFlowOpen, setArchiveFlowOpen] = useState(false);
    const [claimFlowOpen, setClaimFlowOpen] = useState(false);
    const controlsDisabled = roomFlowOpen || archiveFlowOpen || claimFlowOpen;

    function handleAddRoom(newRoom: Room) {
        setRooms((prev) => [...prev, newRoom]);
        onRoomChange(newRoom.id);
    }

    return (
        <div className="flex h-full min-w-0 flex-1">
            {/* Renderer stage */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
            <SplatRenderer
                key={splatUrl}
                roomName={room.name}
                splatUrl={splatUrl}
                items={room.items}
                isDamage={isDamage}
                highlightedItemId={highlightedItemId}
                onHighlight={onHighlight}
                onReadyChange={setSplatReady}
                controlsDisabled={controlsDisabled}
            />

            {/* Top-left floating controls */}
            <div className="absolute left-5 top-5 z-10 flex flex-wrap items-center gap-2.5">
                <RoomSwitcher
                    rooms={rooms}
                    activeRoomId={activeRoomId}
                    onSelect={onRoomChange}
                    onAddRoom={handleAddRoom}
                    onFlowOpenChange={setRoomFlowOpen}
                />
                <TimeframeSelector
                    logs={logs}
                    activeLogId={activeLogId}
                    onSelect={onLogChange}
                    onFlowOpenChange={setClaimFlowOpen}
                />
            </div>

            {isDamage && (
            <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full border border-destructive/40 bg-destructive/15 px-3 py-1 text-xs text-destructive backdrop-blur-md">
                Viewing incident capture · {log.label}
            </div>
        )}

            {/* Archive toggle (top-right) */}
            <button
                onClick={onToggleArchive}
                className={cn(
                "absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm backdrop-blur-xl transition-colors",
                archiveOpen
                ? "border-[#FF8A47] bg-[#FF8A47] text-white"
                : "border-white/15 bg-[#363C43] text-white hover:border-white/20 hover:bg-[#505964]",
                )}
            >
                <Archive className="size-4" />
                <span>Archive</span>
            </button>

            {/* Enter XR (bottom-right of the stage) */}
            <div className="absolute bottom-6 right-6 z-10">
                <EnterXRButton splatUrl={splatUrl} vrReady={splatReady} />
            </div>
        </div>

        {/* Right archive column */}
        <ArchivePanel
            open={archiveOpen}
            room={room}
            userType={userType}
            onSwitchPortal={onSwitchPortal}
            highlightedItemId={highlightedItemId}
            onHighlight={onHighlight}
            onClose={onToggleArchive}
            onFlowOpenChange={setArchiveFlowOpen}
        />

        {/* XR exit overlay - visible only during immersive session */}
        <XROverlay />
        </div>
    );
}