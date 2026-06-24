import { motion, AnimatePresence } from "motion/react";
import { Plus, ShieldCheck, Boxes, X, Package, FileStack, GitCompareArrows, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ItemArchiveCard } from "./ItemArchiveCard";
import { StatusBanner } from "./StatusBanner";
import { StructureList } from "./StructureList";
import { ConditionCompare } from "./ConditionCompare";
import { SceneLiability } from "./SceneLiability";
import { PLANS, type Room, type UserType } from "./data";

type ArchivePanelProps = {
  open: boolean;
  room: Room;
  userType: UserType;
  onSwitchPortal: () => void;
  highlightedItemId: string | null;
  onHighlight: (itemId: string) => void;
  onClose: () => void;
};

export function ArchivePanel({
  open,
  room,
  userType,
  onSwitchPortal,
  highlightedItemId,
  onHighlight,
  onClose,
}: ArchivePanelProps) {
  const plan = PLANS[userType];
  const isExterior = room.kind === "exterior";

  const items = (
    <div className="space-y-3">
      {room.items.map((item) => (
        <ItemArchiveCard
          key={item.id}
          item={item}
          isHighlighted={highlightedItemId === item.id}
          onHighlight={() => onHighlight(item.id)}
        />
      ))}
      {room.items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No items insured in this scene yet.
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 372, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="relative h-full shrink-0 overflow-hidden border-l border-border bg-[#0e0e13]"
        >
          <div className="flex h-full w-[372px] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base">Archive</h2>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-5 px-5 pb-6">
                {/* Status banner */}
                <StatusBanner userType={userType} onSwitchPortal={onSwitchPortal} />

                {/* Bento: plan + stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Current Plan</p>
                    <p className="mt-1 text-sm">{plan.name}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                      <ShieldCheck className="size-3" /> {plan.tier}
                    </span>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Up to{" "}
                      <span className="text-foreground tabular-nums">
                        ${plan.coverage.toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Secured</p>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl tabular-nums">{plan.roomsSecured}</span>
                      <span className="text-xs text-muted-foreground">rooms</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Boxes className="size-4 text-primary" />
                      <span className="tabular-nums text-foreground">{plan.itemsSecured}</span>
                      personal items
                    </p>
                  </div>
                </div>

                {/* Currently viewing scene + per-scene tabs directly beneath */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Currently viewing</p>
                      <h3 className="text-lg">{room.name}</h3>
                    </div>
                    <button
                      onClick={() =>
                        toast("Add to this scene", {
                          description: `Capture a new item or detail in ${room.name}.`,
                        })
                      }
                      className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                      title="Add"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {/* Tabs are scoped to the active scene and adapt per persona. */}
                  {userType === "tenant" ? (
                    <Tabs defaultValue="belongings" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="belongings" className="gap-1.5">
                          <Package className="size-3.5" /> Belongings
                        </TabsTrigger>
                        <TabsTrigger value="condition" className="gap-1.5">
                          <GitCompareArrows className="size-3.5" /> Condition
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="belongings" className="mt-4">
                        {items}
                      </TabsContent>
                      <TabsContent value="condition" className="mt-4">
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
                      <TabsContent value="liability" className="mt-4">
                        <SceneLiability room={room} />
                      </TabsContent>
                      <TabsContent value="structure" className="mt-4">
                        <StructureList records={room.structure} sceneName={room.name} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Tabs defaultValue="items" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="items" className="gap-1.5">
                          <Package className="size-3.5" /> Items
                        </TabsTrigger>
                        <TabsTrigger value="structure" className="gap-1.5">
                          <FileStack className="size-3.5" /> Structure
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="items" className="mt-4">
                        {items}
                      </TabsContent>
                      <TabsContent value="structure" className="mt-4">
                        <StructureList records={room.structure} sceneName={room.name} />
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
