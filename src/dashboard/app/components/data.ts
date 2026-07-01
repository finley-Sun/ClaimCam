// Mock data for the ClaimCam dashboard.
// In a production build this would be hydrated from the user's insurance
// account + the 3DGS capture pipeline. Everything here is illustrative.

export type EvidencePhoto = {
  id: string;
  label: string;
  // Position of the item marker within the renderer, in normalized [0,1] coords.
};

export type InsuredItem = {
  id: string;
  name: string;
  model: string;
  marketValue: number;
  replacementValue: number;
  coverage: number;
  category: string;
  hasEvidence: boolean;
  purchaseDate?: string;
  aiAutofilled?: boolean;
  // Floor-plan placement within splat bounds: x = left→right, y = back→forward, h = height.
  marker: { x: number; y: number; h?: number };
  /** Override marker when viewing a damage/incident splat (different scan bounds). */
  damageMarker?: { x: number; y: number; h?: number };
  position?: [number, number, number];
  evidence?: { before: string; after: string; receipt?: string };
};

export type Room = {
  id: string;
  name: string;
  icon: string; // lucide icon name handled at the call site
  // "interior" rooms hold belongings; "exterior" scenes are grounds/liability.
  kind: "interior" | "exterior";
  items: InsuredItem[];
  // Per-scene construction/structural details (homeowner rebuild matching).
  structure: StructureRecord[];
  // Per-scene move-in/move-out condition (tenant deposit protection).
  condition: ConditionRecord[];
  // Liability exposure, only present on exterior grounds scenes.
  risk?: { level: "low" | "moderate" | "high"; detail: string };
};

export type TimeframeLog = {
  id: string;
  date: string;
  label: string;
  type: "capture" | "damage";
  // Tenant tenancy phase, used to mark before/after-tenancy captures.
  phase?: "move-in" | "move-out";
};

export type UserType = "homeowner" | "tenant";

export type UserProfile = {
  type: UserType;
  label: string;
  name: string;
  residence: string; // House number or apartment unit
  address: string;
  policyNo: string;
};

// Architectural / structural documentation (homeowners care about rebuild cost).
export type StructureRecord = {
  id: string;
  name: string;
  icon: string;
  detail: string;
  rebuildCost: number;
  updated: string;
  // Extended fields for the new card design
  area?: string;
  costFormula?: string;
  source?: string;
  installedDate?: string;
};

// External liability exposures on the property (homeowner policy liability).
export type GroundsRisk = {
  id: string;
  name: string;
  icon: string;
  detail: string;
  risk: "low" | "moderate" | "high";
};

// Tenant move-in vs move-out condition comparison (landlord-provided fixtures).
export type ConditionRecord = {
  id: string;
  name: string;
  icon: string;
  moveIn: string;
  current: string;
  flagged: boolean;
};

export type Claim = {
  id: string;
  title: string;
  room: string;
  date: string;
  status: "approved" | "in_review" | "submitted" | "paid";
  progress: number;
  amount: number;
  description: string;
  evidenceCount: number;
};

export const PLAN = {
  name: "HomeGuard Plus",
  tier: "Premium",
  policyNo: "CC-2024-882104",
  coverage: 250000,
  roomsSecured: 5,
  itemsSecured: 10,
  renewal: "2026-12-01",
};

export const ROOMS: Room[] = [
  {
    id: "living-room",
    name: "Living Room",
    icon: "Sofa",
    kind: "interior",
    items: [
      {
        id: "tv",
        name: "OLED Television",
        model: 'LG C3 65" · OLED65G2PUA',
        marketValue: 1400,
        replacementValue: 1800,
        coverage: 1500,
        category: "Electronics",
        hasEvidence: true,
        purchaseDate: "May 23, 2025",
        aiAutofilled: true,
        marker: { x: 0.23, y: 0.79, h: 0.52 },
        damageMarker: { x: 0.249, y: 0.818, h: 0.397 },
        evidence: {
          before: "/evidence/OLED_TV/before.jpg.webp",
          after: "/evidence/OLED_TV/after.png",
          receipt: "/evidence/OLED_TV/receipt.jpg",
        },
      },
      {
        id: "monitor",
        name: "Computer Monitor",
        model: 'Dell UltraSharp U2723QE 27" · S/N 7KXQ2H3',
        marketValue: 420,
        replacementValue: 680,
        coverage: 600,
        category: "Electronics",
        hasEvidence: true,
        purchaseDate: "Jan 18, 2024",
        aiAutofilled: true,
        marker: { x: 0.79, y: 0.13, h: 0.24 },
        damageMarker: { x: 0.72, y: 0.047, h: 0.361 },
        evidence: {
          before: "/evidence/Dell_monitor/before.jpg",
          after: "/evidence/Dell_monitor/after.png",
          receipt: "/evidence/Dell_monitor/receipt_dell.jpg",
        },
      },
      {
        id: "speaker",
        name: "Smart Speaker",
        model: "Sonos Five · S/N F5C9A41",
        marketValue: 390,
        replacementValue: 549,
        coverage: 400,
        category: "Electronics",
        hasEvidence: true,
        purchaseDate: "Nov 30, 2023",
        aiAutofilled: true,
        marker: { x: 0.12, y: 0.65, h: 0.3 },
        damageMarker: { x: 0.098, y: 0.645, h: 0.277 },
        evidence: {
          before: "/evidence/smart_speaker/before.jpg",
          after: "/evidence/smart_speaker/after.png",
          receipt: "/evidence/smart_speaker/receipt_speaker.jpg",
        },
      },
      {
        id: "sofa",
        name: "Sectional Sofa",
        model: "IKEA VIMLE 4-seat with chaise · Art. 793.995.45",
        marketValue: 2000,
        replacementValue: 2400,
        coverage: 2000,
        category: "Furniture",
        hasEvidence: true,
        purchaseDate: "May 23, 2025",
        aiAutofilled: true,
        marker: { x: 0.42, y: 0.22, h: 0.24 },
        damageMarker: { x: 0.373, y: 0.162, h: 0.366 },
        evidence: {
          before: "/evidence/sectional_sofa/before.jpg",
          after: "/evidence/sectional_sofa/after.png",
          receipt: "/evidence/sectional_sofa/receipt_sofa.jpg",
        },
      },
      {
        id: "piano",
        name: "Upright Piano",
        model: "Yamaha U1 · S/N 6125473",
        marketValue: 6500,
        replacementValue: 9200,
        coverage: 8000,
        category: "Instrument",
        hasEvidence: true,
        purchaseDate: "Aug 12, 2019",
        aiAutofilled: false,
        marker: { x: 0.75, y: 0.61, h: 0.38 },
        damageMarker: { x: 0.793, y: 0.53, h: 0.365 },
        evidence: {
          before: "/evidence/upright_piano/before.jpg",
          after: "/evidence/upright_piano/after.png",
          receipt: "/evidence/upright_piano/receipt_piano.jpg",
        },
      },
    ],
    structure: [
      {
        id: "lr-floor",
        name: "Flooring",
        icon: "Ruler",
        detail: "White oak · wide-plank · matte finish",
        rebuildCost: 5760,
        updated: "2024-09-12",
        area: "320 sq ft",
        costFormula: "$18 / sq ft × 320 sq ft",
        source: "From contractor invoice",
        installedDate: "Mar 2023",
      },
    ],
    condition: [
      {
        id: "lr-walls",
        name: "Walls & Paint",
        icon: "PaintRoller",
        moveIn: "Freshly painted, no marks",
        current: "Minor scuffs near entry",
        flagged: false,
      },
      {
        id: "lr-flooring",
        name: "Flooring",
        icon: "Grid3x3",
        moveIn: "Hardwood, no scratches",
        current: "Light wear by sofa",
        flagged: false,
      },
      {
        id: "lr-windows-c",
        name: "Windows & Blinds",
        icon: "Blinds",
        moveIn: "Sealed, blinds intact",
        current: "No change",
        flagged: false,
      },
    ],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    icon: "BedDouble",
    kind: "interior",
    items: [],
    structure: [],
    condition: [
      {
        id: "bd-walls",
        name: "Walls & Paint",
        icon: "PaintRoller",
        moveIn: "Freshly painted",
        current: "No change",
        flagged: false,
      },
      {
        id: "bd-flooring",
        name: "Carpet",
        icon: "Grid3x3",
        moveIn: "New, no stains",
        current: "Light traffic wear",
        flagged: false,
      },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    icon: "CookingPot",
    kind: "interior",
    items: [],
    structure: [],
    condition: [
      {
        id: "kt-appliances",
        name: "Appliances (provided)",
        icon: "Refrigerator",
        moveIn: "All functional",
        current: "Dishwasher leak — landlord",
        flagged: true,
      },
      {
        id: "kt-fixtures",
        name: "Fixtures & Cabinets",
        icon: "Lightbulb",
        moveIn: "Intact, all keys present",
        current: "Cabinet hinge loose",
        flagged: true,
      },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    icon: "Bath",
    kind: "interior",
    items: [],
    structure: [],
    condition: [
      {
        id: "ba-fixtures",
        name: "Fixtures",
        icon: "Lightbulb",
        moveIn: "All intact",
        current: "Faucet drip — reported",
        flagged: true,
      },
    ],
  },
];

export const TIMEFRAME_LOGS: TimeframeLog[] = [
  { id: "t0", date: "2026-06-01", label: "Latest capture", type: "capture" },
  { id: "t4", date: "2026-05-01", label: "Living room fire", type: "damage" },
  { id: "t1", date: "2025-12-15", label: "Annual re-scan", type: "capture" },
  { id: "t2", date: "2025-10-31", label: "Fire damage splats", type: "damage" },
  { id: "t3", date: "2025-08-01", label: "Initial capture", type: "capture" },
];

export const CLAIMS: Claim[] = [
  {
    id: "c1",
    title: "Kitchen fire — appliance damage",
    room: "Kitchen",
    date: "2025-11-02",
    status: "paid",
    progress: 100,
    amount: 4800,
    description:
      "Electrical fire damaged the refrigerator and surrounding cabinetry. 3DGS capture from 2025-10-31 provided full pre-incident evidence.",
    evidenceCount: 6,
  },
  {
    id: "c2",
    title: "Water leak — living room flooring",
    room: "Living Room",
    date: "2026-02-18",
    status: "approved",
    progress: 80,
    amount: 2100,
    description:
      "Burst pipe caused water damage to hardwood flooring and the sectional sofa base.",
    evidenceCount: 4,
  },
  {
    id: "c5",
    title: "Fire damage — living room",
    room: "Living Room",
    date: "2026-05-01",
    status: "in_review",
    progress: 40,
    amount: 15128,
    description:
      "Fire damage to living room furnishings and electronics. 3DGS splat archive from prior scan used as pre-incident evidence.",
    evidenceCount: 5,
  },
  {
    id: "c3",
    title: "Theft — bedroom valuables",
    room: "Bedroom",
    date: "2026-05-09",
    status: "in_review",
    progress: 45,
    amount: 5400,
    description:
      "Reported theft of luxury watch. Splat archive confirms presence and condition prior to incident.",
    evidenceCount: 3,
  },
  {
    id: "c4",
    title: "Storm damage — window",
    room: "Living Room",
    date: "2026-06-04",
    status: "submitted",
    progress: 15,
    amount: 900,
    description:
      "Storm debris cracked the living room window. Awaiting adjuster assignment.",
    evidenceCount: 2,
  },
];

// ---------------------------------------------------------------------------
// Persona-aware data
// ---------------------------------------------------------------------------

export const USER_PROFILES: Record<UserType, UserProfile> = {
  homeowner: {
    type: "homeowner",
    label: "Homeowner",
    name: "Jordan Avery",
    residence: "House No. 1428",
    address: "1428 Maple Crest Dr, Portland, OR 97203",
    policyNo: "CC-HO-2024-882104",
  },
  tenant: {
    type: "tenant",
    label: "Tenant",
    name: "Riley Chen",
    residence: "Unit 4B",
    address: "880 Harbor View Apartments, Seattle, WA 98101",
    policyNo: "CC-RT-2025-114902",
  },
};

// Tenants only document interior spaces; homeowners also own grounds scenes.
export function getRoomsByUser(userType: UserType): Room[] {
  return userType === "tenant" ? ROOMS.filter((r) => r.kind === "interior") : ROOMS;
}

// Homeowner timeline: routine captures + incidents.
export const HOMEOWNER_LOGS: TimeframeLog[] = TIMEFRAME_LOGS;

// Tenant timeline: tagged with move-in / move-out tenancy phases.
export const TENANT_LOGS: TimeframeLog[] = [
  {
    id: "tt0",
    date: "2026-05-30",
    label: "Move-out inspection",
    type: "capture",
    phase: "move-out",
  },
  {
    id: "tt1",
    date: "2025-06-15",
    label: "Annual condition scan",
    type: "capture",
  },
  {
    id: "tt2",
    date: "2024-08-01",
    label: "Move-in baseline",
    type: "capture",
    phase: "move-in",
  },
];

export const PLANS: Record<UserType, typeof PLAN> = {
  homeowner: PLAN,
  tenant: {
    name: "Renters Shield",
    tier: "Standard",
    policyNo: "CC-RT-2025-114902",
    coverage: 60000,
    roomsSecured: 3,
    itemsSecured: 7,
    renewal: "2026-08-01",
  },
};

export const PHASE_LABEL: Record<NonNullable<TimeframeLog["phase"]>, string> = {
  "move-in": "Before Move In",
  "move-out": "Move Out",
};

export const LOGS_BY_USER: Record<UserType, TimeframeLog[]> = {
  homeowner: HOMEOWNER_LOGS,
  tenant: TENANT_LOGS,
};
