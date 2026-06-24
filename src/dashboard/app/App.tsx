import { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { Sidebar, type PageKey } from "./components/Sidebar";
import { PropertyView } from "./components/PropertyView";
import { ClaimsView } from "./components/ClaimsView";
import { PortalEntry } from "./components/PortalEntry";
import { getRoomsByUser, LOGS_BY_USER, type UserType } from "./components/data";

export default function App() {
  const [page, setPage] = useState<PageKey>("property");
  // null until the user picks a portal on the entry screen.
  const [userType, setUserType] = useState<UserType | null>(null);
  const [activeRoomId, setActiveRoomId] = useState("living-room");
  const [activeLogId, setActiveLogId] = useState(LOGS_BY_USER.homeowner[0].id);
  const [archiveOpen, setArchiveOpen] = useState(true);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Render the dashboard with a fallback persona behind the blurred entry screen.
  const effectiveUser: UserType = userType ?? "homeowner";

  const handleRoomChange = (id: string) => {
    setActiveRoomId(id);
    setHighlightedItemId(null);
  };

  const handleSelectPortal = (type: UserType) => {
    setUserType(type);
    // Each persona has its own scenes and timeline; reset to sensible defaults.
    setActiveRoomId(getRoomsByUser(type)[0].id);
    setActiveLogId(LOGS_BY_USER[type][0].id);
    setHighlightedItemId(null);
  };

  const handleSwitchPortal = () => {
    // Return to the entry screen to switch between Owner / Tenant flows.
    setUserType(null);
  };

  const handleHighlight = (id: string) => {
    setHighlightedItemId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="dark relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div
        className={
          userType === null
            ? "pointer-events-none flex min-w-0 flex-1 scale-[1.02] blur-md select-none"
            : "flex min-w-0 flex-1"
        }
        aria-hidden={userType === null}
      >
        <Sidebar page={page} onNavigate={setPage} />

        <main className="flex min-w-0 flex-1">
          {page === "property" && userType !== null ? (
            <PropertyView
              userType={effectiveUser}
              onSwitchPortal={handleSwitchPortal}
              activeRoomId={activeRoomId}
              onRoomChange={handleRoomChange}
              activeLogId={activeLogId}
              onLogChange={setActiveLogId}
              archiveOpen={archiveOpen}
              onToggleArchive={() => setArchiveOpen((o) => !o)}
              highlightedItemId={highlightedItemId}
              onHighlight={handleHighlight}
            />
          ) : (
            <ClaimsView />
          )}
        </main>
      </div>

      {userType === null && <PortalEntry onSelect={handleSelectPortal} />}

      <Toaster position="bottom-center" theme="dark" />
    </div>
  );
}
