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
  coverage: number;
  category: string;
  hasEvidence: boolean;
  // Normalized screen hint for raycast placement onto the splat surface.
  marker: { x: number; y: number };
  // Optional fixed world anchor [x, y, z] in splat space (overrides marker raycast).
  position?: [number, number, number];
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
        model: "LG C3 65\"",
        marketValue: 1800,
        coverage: 1500,
        category: "Electronics",
        hasEvidence: true,
        marker: { x: 0.5, y: 0.36 },
      },
      {
        id: "curtains",
        name: "Window Curtains",
        model: "Linen blackout drapes",
        marketValue: 420,
        coverage: 350,
        category: "Furnishings",
        hasEvidence: false,
        marker: { x: 0.82, y: 0.34 },
      },
      {
        id: "speaker",
        name: "Smart Speaker",
        model: "Sonos Era 300",
        marketValue: 450,
        coverage: 400,
        category: "Audio",
        hasEvidence: true,
        marker: { x: 0.68, y: 0.5 },
      },
      {
        id: "sofa",
        name: "Sectional Couch",
        model: "West Elm Harmony",
        marketValue: 2400,
        coverage: 2000,
        category: "Furniture",
        hasEvidence: false,
        marker: { x: 0.5, y: 0.68 },
      },
      {
        id: "console",
        name: "Game Console",
        model: "PlayStation 5 Pro",
        marketValue: 700,
        coverage: 650,
        category: "Electronics",
        hasEvidence: true,
        marker: { x: 0.35, y: 0.52 },
      },
    ],
    structure: [
      {
        id: "lr-floor",
        name: "White-Oak Flooring",
        icon: "Ruler",
        detail: "Wide-plank, site-finished",
        rebuildCost: 9800,
        updated: "2024-09-12",
      },
      {
        id: "lr-molding",
        name: "Crown Molding & Trim",
        icon: "Hammer",
        detail: "Custom millwork, coffered ceiling",
        rebuildCost: 6400,
        updated: "2024-09-12",
      },
      {
        id: "lr-electrical",
        name: "Electrical & Lighting",
        icon: "Zap",
        detail: "Recessed LED, smart switches",
        rebuildCost: 3200,
        updated: "2021-11-18",
      },
      {
        id: "lr-windows",
        name: "Picture Windows",
        icon: "Ruler",
        detail: "Triple-pane, custom size",
        rebuildCost: 5600,
        updated: "2024-09-12",
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
    items: [
      {
        id: "mattress",
        name: "King Mattress",
        model: "Casper Wave Hybrid",
        marketValue: 2200,
        coverage: 1800,
        category: "Furniture",
        hasEvidence: true,
        marker: { x: 0.5, y: 0.6 },
      },
      {
        id: "watch",
        name: "Luxury Watch",
        model: "Omega Seamaster",
        marketValue: 5400,
        coverage: 5000,
        category: "Valuables",
        hasEvidence: true,
        marker: { x: 0.7, y: 0.4 },
      },
    ],
    structure: [
      {
        id: "bd-closet",
        name: "Walk-in Closet Build-out",
        icon: "Hammer",
        detail: "Custom shelving system",
        rebuildCost: 5200,
        updated: "2023-03-14",
      },
      {
        id: "bd-electrical",
        name: "Electrical & Lighting",
        icon: "Zap",
        detail: "Dimmable sconces, ceiling fan",
        rebuildCost: 2100,
        updated: "2021-11-18",
      },
    ],
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
    items: [
      {
        id: "fridge",
        name: "Smart Refrigerator",
        model: "Samsung Family Hub",
        marketValue: 3200,
        coverage: 2800,
        category: "Appliances",
        hasEvidence: true,
        marker: { x: 0.4, y: 0.45 },
      },
      {
        id: "espresso",
        name: "Espresso Machine",
        model: "Breville Oracle Touch",
        marketValue: 2500,
        coverage: 2200,
        category: "Appliances",
        hasEvidence: false,
        marker: { x: 0.68, y: 0.58 },
      },
    ],
    structure: [
      {
        id: "kt-plumbing",
        name: "Plumbing",
        icon: "Droplets",
        detail: "Copper + PEX, pot filler, disposal",
        rebuildCost: 6800,
        updated: "2023-05-02",
      },
      {
        id: "kt-cabinets",
        name: "Cabinetry & Counters",
        icon: "Hammer",
        detail: "Custom maple, quartz counters",
        rebuildCost: 18400,
        updated: "2024-09-12",
      },
      {
        id: "kt-electrical",
        name: "Electrical",
        icon: "Zap",
        detail: "Dedicated circuits, under-cabinet LED",
        rebuildCost: 3600,
        updated: "2021-11-18",
      },
      {
        id: "kt-hvac",
        name: "Range Hood & Vent",
        icon: "Wind",
        detail: "Ducted, 600 CFM",
        rebuildCost: 1900,
        updated: "2024-09-12",
      },
    ],
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
    items: [
      {
        id: "mirror",
        name: "Smart Mirror",
        model: "HiMirror Slide",
        marketValue: 600,
        coverage: 500,
        category: "Electronics",
        hasEvidence: false,
        marker: { x: 0.5, y: 0.38 },
      },
    ],
    structure: [
      {
        id: "ba-plumbing",
        name: "Plumbing & Fixtures",
        icon: "Droplets",
        detail: "Rain shower, freestanding tub",
        rebuildCost: 7400,
        updated: "2023-05-02",
      },
      {
        id: "ba-tile",
        name: "Tile Work",
        icon: "Hammer",
        detail: "Porcelain floor + wall, heated floor",
        rebuildCost: 5900,
        updated: "2024-09-12",
      },
    ],
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
  {
    id: "pool",
    name: "Pool & Patio",
    icon: "Waves",
    kind: "exterior",
    risk: { level: "high", detail: "18×36 ft in-ground · fenced, alarm-equipped" },
    items: [
      {
        id: "pool-heater",
        name: "Pool Heater",
        model: "Pentair MasterTemp 400",
        marketValue: 2600,
        coverage: 2300,
        category: "Equipment",
        hasEvidence: true,
        marker: { x: 0.72, y: 0.62 },
      },
    ],
    structure: [
      {
        id: "pl-shell",
        name: "Pool Shell & Decking",
        icon: "Hammer",
        detail: "Gunite shell, travertine deck",
        rebuildCost: 42000,
        updated: "2022-06-20",
      },
      {
        id: "pl-equipment",
        name: "Filtration & Plumbing",
        icon: "Droplets",
        detail: "Variable-speed pump, saltwater system",
        rebuildCost: 8800,
        updated: "2024-04-10",
      },
    ],
    condition: [],
  },
  {
    id: "front-walk",
    name: "Front Walk & Drive",
    icon: "Footprints",
    kind: "exterior",
    risk: { level: "moderate", detail: "Public-facing · slip & trip exposure" },
    items: [],
    structure: [
      {
        id: "fw-concrete",
        name: "Concrete Walk & Driveway",
        icon: "Ruler",
        detail: "Stamped concrete, 620 sqft",
        rebuildCost: 11200,
        updated: "2023-08-05",
      },
    ],
    condition: [],
  },
  {
    id: "grounds",
    name: "Garden & Trees",
    icon: "Trees",
    kind: "exterior",
    risk: { level: "moderate", detail: "3 mature oaks · overhang near neighbor's roof" },
    items: [],
    structure: [
      {
        id: "gr-retaining",
        name: "Retaining Wall",
        icon: "Hammer",
        detail: "Stone, 24 ft run",
        rebuildCost: 9400,
        updated: "2022-09-18",
      },
      {
        id: "gr-irrigation",
        name: "Irrigation System",
        icon: "Droplets",
        detail: "8-zone automatic, drip + spray",
        rebuildCost: 3600,
        updated: "2023-04-22",
      },
    ],
    condition: [],
  },
];

export const TIMEFRAME_LOGS: TimeframeLog[] = [
  { id: "t0", date: "2026-06-01", label: "Latest capture", type: "capture" },
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
