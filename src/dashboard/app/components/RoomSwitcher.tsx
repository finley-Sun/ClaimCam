import { useState, useEffect } from "react";
import {
    ChevronDown,
    Plus,
    Sofa,
    BedDouble,
    CookingPot,
    Bath,
    Waves,
    Footprints,
    Trees,
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { CreationFlowModal } from "./flows/CreationFlowModal";
import type { Room } from "./data";

const ICONS: Record<string, typeof Sofa> = {
    Sofa,
    BedDouble,
    CookingPot,
    Bath,
    Waves,
    Footprints,
    Trees,
};

type RoomSwitcherProps = {
    rooms: Room[];
    activeRoomId: string;
    onSelect: (roomId: string) => void;
    onAddRoom: (room: Room) => void;
    onFlowOpenChange?: (open: boolean) => void;
};

function RoomRow({ room, onSelect }: { room: Room; onSelect: (id: string) => void }) {
    const Icon = ICONS[room.icon] ?? Sofa;
    return (
        <DropdownMenuItem onClick={() => onSelect(room.id)} className="gap-2.5">
            <Icon className="size-4 text-muted-foreground" />
            <span>{room.name}</span>
            {room.kind === "interior" && (
                <span className="ml-auto text-xs text-muted-foreground">
                    {room.items.length}
                </span>
            )}
        </DropdownMenuItem>
    );
}

export function RoomSwitcher({
    rooms,
    activeRoomId,
    onSelect,
    onAddRoom,
    onFlowOpenChange,
}: RoomSwitcherProps) {
    const [creationOpen, setCreationOpen] = useState(false);

    useEffect(() => {
        onFlowOpenChange?.(creationOpen);
    }, [creationOpen, onFlowOpenChange]);

    const active = rooms.find((r) => r.id === activeRoomId) ?? rooms[0];
    const ActiveIcon = ICONS[active.icon] ?? Sofa;

    const interior = rooms.filter((r) => r.kind === "interior");
    const exterior = rooms.filter((r) => r.kind === "exterior");

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-[var(--surface-glass-border)] bg-[var(--surface-glass-strong)] py-2 pl-3 pr-3.5 text-sm text-foreground backdrop-blur-xl transition-colors hover:border-primary/40">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <ActiveIcon className="size-4" />
                    </span>
                    <span>{active.name}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Rooms
                    </DropdownMenuLabel>
                    {interior.map((room) => (
                        <RoomRow key={room.id} room={room} onSelect={onSelect} />
                    ))}
                    <DropdownMenuItem
                        onClick={() => setCreationOpen(true)}
                        className="gap-2.5 text-primary focus:text-primary"
                    >
                        <Plus className="size-4" />
                        <span>Add Room</span>
                    </DropdownMenuItem>

                    {exterior.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Grounds & Liability
                            </DropdownMenuLabel>
                            {exterior.map((room) => (
                                <RoomRow key={room.id} room={room} onSelect={onSelect} />
                            ))}
                            <DropdownMenuItem
                                onClick={() => setCreationOpen(true)}
                                className="gap-2.5 text-primary focus:text-primary"
                            >
                                <Plus className="size-4" />
                                <span>Add Scene</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <CreationFlowModal
                open={creationOpen}
                mode="room"
                onClose={() => setCreationOpen(false)}
                onCompleteRoom={(newRoom) => {
                    onAddRoom(newRoom);
                    toast("Room added", {
                        description: `"${newRoom.name}" is now available.`,
                    });
                }}
            />
        </>
    );
}