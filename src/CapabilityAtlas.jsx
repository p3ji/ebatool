import React, { useState, useMemo } from "react";
import {
  Lock, Sparkles, Grid3x3, Route, BookOpen, X, Plus, Info, ChevronRight,
  Check, NotebookPen, Flag, Recycle, GraduationCap, ShieldAlert, Puzzle,
  Cpu, Coins, HeartHandshake, Link2, Zap, Layers, Database
} from "lucide-react";

/* ============================================================
   CAPABILITY ATLAS — clickable EBA prototype (v2: overlay modules)
   ink navy / warm paper / archival gold / heat crimson / teal
   IBM Plex Sans (UI) + IBM Plex Mono (data & IDs)
   ============================================================ */

const C = {
  ink: "#16233A", ink2: "#2B3B58", paper: "#F4F2EC", card: "#FFFFFF",
  line: "#DDD8CC", gold: "#D99A2B", goldSoft: "#F7E8C8", crimson: "#8E2540",
  teal: "#2F6F6A", tealSoft: "#DDEBE9", violet: "#5A4A8A", violetSoft: "#E7E2F2",
  mut: "#6E7686", heatLo: [238, 234, 224], heatHi: [142, 37, 64],
};
const heat = (t) => {
  const a = C.heatLo, b = C.heatHi;
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
const ai = (t) => `rgb(${Math.round(231 - 141 * t)},${Math.round(226 - 152 * t)},${Math.round(242 - 104 * t)})`;
const fmtK = (n) => `$${n.toLocaleString()}K`;
const FTE_COST = 130; // $K per FTE/yr, used by Cost overlay

/* ---------------- Seed data ---------------- */
const UNITS = [
  { id: "u1", name: "Business Survey Operations", short: "BSO", ready: 45 },
  { id: "u2", name: "Data Integration Branch", short: "DIB", ready: 62 },
  { id: "u3", name: "Dissemination & Client Services", short: "DCS", ready: 71 },
  { id: "u4", name: "Labour Market Analysis", short: "LMA", ready: 38, mine: true },
];
const TAXONOMY = [
  { id: "c1", std: "Frame Maintenance", plain: "Keeping population & contact lists current", ready: 55, om: 40 },
  { id: "c2", std: "Survey Collection", plain: "Gathering data from respondents", ready: 70, om: 90 },
  { id: "c3", std: "Processing & Editing", plain: "Cleaning and coding raw data", ready: 84, om: 30 },
  { id: "c4", std: "Estimation & Modelling", plain: "Turning data into estimates", ready: 42, om: 20 },
  { id: "c5", std: "Disclosure Control", plain: "Protecting confidentiality before release", ready: 35, om: 15, pii: true },
  { id: "c6", std: "Dissemination", plain: "Publishing and delivering outputs", ready: 60, om: 50 },
  { id: "c7", std: "Stakeholder Engagement", plain: "Working with clients & partners", ready: 24, om: 25 },
  { id: "c8", std: "Metadata Management", plain: "Documenting datasets & definitions", ready: 68, om: 20 },
];
const READY_FACTORS = { data: "Data quality", std: "Standardization", rep: "Decision repeatability", vol: "Volume" };

const SEED_SERVICES = [
  { id: "s1", unitId: "u1", name: "Monthly Business Conditions Survey", to: "Program analysts" },
  { id: "s2", unitId: "u1", name: "Annual Enterprise Survey", to: "National accounts" },
  { id: "s3", unitId: "u2", name: "Integrated Business Register", to: "All survey programs" },
  { id: "s4", unitId: "u2", name: "Record Linkage Service", to: "Research partners" },
  { id: "s5", unitId: "u3", name: "Data Portal & Custom Tabulations", to: "Public & clients" },
];
const SEED_PROCESSES = [
  { id: "p1", unitId: "u1", capId: "c1", name: "BSO frame refresh", fte: 2 },
  { id: "p2", unitId: "u1", capId: "c2", name: "CATI/CAWI collection operations", fte: 6 },
  { id: "p3", unitId: "u1", capId: "c3", name: "Manual editing & coding", fte: 4 },
  { id: "p4", unitId: "u1", capId: "c8", name: "Survey metadata sheets", fte: 1 },
  { id: "p5", unitId: "u2", capId: "c1", name: "Register maintenance", fte: 3 },
  { id: "p6", unitId: "u2", capId: "c3", name: "Linkage cleaning", fte: 2 },
  { id: "p7", unitId: "u2", capId: "c8", name: "Enterprise metadata repository", fte: 2 },
  { id: "p8", unitId: "u3", capId: "c5", name: "Pre-release vetting", fte: 1.5 },
  { id: "p9", unitId: "u3", capId: "c6", name: "Portal publishing", fte: 4 },
  { id: "p10", unitId: "u3", capId: "c7", name: "Client services desk", fte: 2 },
  { id: "p11", unitId: "u3", capId: "c8", name: "Product metadata upkeep", fte: 1 },
];
const FF_SERVICES = [
  { id: "sx1", unitId: "u4", name: "Monthly Labour Market Bulletin", to: "Public & media" },
  { id: "sx2", unitId: "u4", name: "Custom Labour Data Requests", to: "Policy analysts" },
];
const FF_PROCESSES = [
  { id: "px1", unitId: "u4", capId: "c4", name: "LMA estimation models", fte: 3 },
  { id: "px2", unitId: "u4", capId: "c6", name: "Bulletin publishing", fte: 1.5 },
  { id: "px3", unitId: "u4", capId: "c2", name: "Supplementary employer survey", fte: 1 },
  { id: "px4", unitId: "u4", capId: "c8", name: "LMA metadata tracking", fte: 0.5 },
];

/* semantic near-duplicate candidates (Pass 2) — pre-computed similarities */
const SEMANTIC = [
  { a: "Client services desk (DCS)", b: "Respondent relations line (LMA)", sim: 0.89, cap: "Stakeholder Engagement" },
  { a: "Enterprise metadata repository (DIB)", b: "LMA metadata tracking (LMA)", sim: 0.86, cap: "Metadata Management" },
  { a: "Pre-release vetting (DCS)", b: "Confidentiality review (BSO)", sim: 0.83, cap: "Disclosure Control" },
];

/* shared Information Objects (Pass 3) — data-effort duplication independent of capability/process text */
const INFO_OBJECTS = [
  { id: "io1", name: "Business Register / Frame", desc: "Master list of business entities — identifiers, structure, contact info." },
  { id: "io2", name: "Respondent Contact List", desc: "Names, emails, phone numbers used to reach survey respondents." },
  { id: "io3", name: "Metadata Repository", desc: "Variable definitions, classifications, and methodology documentation." },
];
const INFO_LINKS = [
  { procId: "p1", ioId: "io1", role: "maintains" },
  { procId: "p5", ioId: "io1", role: "maintains" },
  { procId: "p9", ioId: "io1", role: "consumes" },
  { procId: "px1", ioId: "io1", role: "consumes" },
  { procId: "p2", ioId: "io2", role: "consumes" },
  { procId: "p10", ioId: "io2", role: "maintains" },
  { procId: "p4", ioId: "io3", role: "maintains" },
  { procId: "p7", ioId: "io3", role: "maintains" },
  { procId: "p11", ioId: "io3", role: "maintains" },
  { procId: "px4", ioId: "io3", role: "maintains" },
];

/* ---------------- Work packages ---------------- */
const BASE_WPS = [
  { id: "WP1", name: "Consolidate collection onto shared platform", cost: 800, benefit: 90, deps: [], skills: ["Platform ops"], kind: "consolidate" },
  { id: "WP2", name: "Data governance uplift — frames & registers", cost: 300, benefit: 80, deps: [], skills: ["Data stewardship"], kind: "governance" },
  { id: "WP3", name: "Unified metadata service", cost: 350, benefit: 70, deps: [], skills: ["Metadata standards"], kind: "consolidate" },
  { id: "WP4", name: "AI-assisted coding & editing", cost: 600, benefit: 85, deps: ["WP1", "WP2"], skills: ["ML ops", "QA design"], kind: "ai", capId: "c3", touchesPII: true },
  { id: "WP5", name: "ML nonresponse follow-up", cost: 450, benefit: 75, deps: ["WP2"], skills: ["ML ops"], kind: "ai", capId: "c2", touchesPII: true },
  { id: "WP6", name: "Skills uplift — ML operations cohort", cost: 200, benefit: 60, deps: [], skills: [], kind: "people" },
  { id: "WP7", name: "Decommission legacy collection apps", cost: 150, benefit: 65, deps: ["WP4"], skills: [], savings: 500, kind: "retire" },
  { id: "WP8", name: "Cross-functional product team pilot", cost: 250, benefit: 62, deps: ["WP3"], skills: ["Product management"], kind: "people", unitId: "u4" },
];
const YEARS = ["FY27–28", "FY28–29", "FY29–30", "FY30–31"];

/* Assemble active work-package set from the base plan, user-proposed packages, and installed overlays (the "rule set" of each module) */
function activeWPs(mods, customWPs = []) {
  let list = [...BASE_WPS, ...customWPs].map((w) => ({ ...w, deps: [...w.deps], pia: false, injected: false }));
  if (mods.pia) {
    list.push({ id: "WP-PIA", name: "Privacy Impact Assessment & consultation", cost: 100, benefit: 55, deps: [], skills: ["Privacy"], kind: "governance", injected: true });
    list = list.map((w) => (w.touchesPII ? { ...w, pia: true, deps: [...w.deps, "WP-PIA"] } : w));
  }
  if (mods.change) {
    list.push({ id: "WP-CM", name: "Change-management runway — LMA", cost: 120, benefit: 50, deps: [], skills: ["Change mgmt"], kind: "people", injected: true });
    list = list.map((w) => (w.unitId === "u4" ? { ...w, deps: [...w.deps, "WP-CM"] } : w));
  }
  return list;
}

function planRoadmap(base, mods, customWPs = []) {
  const WPS = activeWPs(mods, customWPs);
  const byId = Object.fromEntries(WPS.map((w) => [w.id, w]));
  const done = new Set(), order = [];
  let frontier = WPS.filter((w) => !w.deps.length);
  while (frontier.length) {
    frontier.sort((a, b) => b.benefit - a.benefit);
    const w = frontier.shift();
    if (done.has(w.id)) continue;
    order.push(w); done.add(w.id);
    WPS.forEach((x) => {
      if (!done.has(x.id) && x.deps.every((d) => done.has(d)) && !frontier.includes(x)) frontier.push(x);
    });
  }
  const rem = YEARS.map(() => base);
  const yearOf = {}, waves = YEARS.map(() => []), boosts = YEARS.map(() => 0), deferred = [];
  for (const w of order) {
    const earliest = w.deps.length ? Math.max(...w.deps.map((d) => (yearOf[d] ?? 99) + 1)) : 0;
    let placed = false;
    for (let y = earliest; y < YEARS.length; y++) {
      if (rem[y] >= w.cost) {
        rem[y] -= w.cost; yearOf[w.id] = y; waves[y].push(w); placed = true;
        if (w.savings) for (let yy = y + 1; yy < YEARS.length; yy++) { rem[yy] += w.savings; boosts[yy] += w.savings; }
        break;
      }
    }
    if (!placed) deferred.push({ w, reason: w.deps.some((d) => yearOf[d] === undefined) ? "a prerequisite package is itself unscheduled" : "exceeds every remaining fiscal-year envelope at the current budget" });
  }
  return { waves, deferred, boosts, byId };
}

/* ---------------- Overlay module catalogue (Part 4 contract) ---------------- */
const MODULES = [
  {
    id: "cost", name: "Cost & Effort", icon: Coins, tone: "gold", wave: "Wave 1",
    tag: "attribute overlay",
    blurb: "Attaches FTE and O&M cost to processes. Upgrades overlap scoring from unitless effort to dollarized savings.",
    adds: { attrs: "annual $ per process (FTE × $130K + O&M)", rules: "consolidation savings estimate", views: "$ column on candidates" },
  },
  {
    id: "airead", name: "AI-Readiness Scoring", icon: Cpu, tone: "violet", wave: "Wave 1",
    tag: "attribute + view overlay",
    blurb: "Scores each capability on data quality × standardization × repeatability × volume. Ranks automation candidates and feeds the target state.",
    adds: { attrs: "0–100 readiness score per capability", rules: "automation-candidate ranking", views: "AI column on heatmap + candidate panel" },
  },
  {
    id: "pia", name: "PIA Triggers", icon: ShieldAlert, tone: "red", wave: "Wave 2",
    tag: "rule-set overlay",
    blurb: "Pure rules, no new entities. When an AI package touches personal information, auto-flags 'PIA required' and injects a PIA task ahead of it in the roadmap.",
    adds: { attrs: "personal-info flag on capabilities", rules: "PIA trigger → dependency edge", views: "compliance badges on waves" },
  },
  {
    id: "change", name: "Change-Readiness", icon: HeartHandshake, tone: "teal", wave: "Wave 3",
    tag: "attribute + soft-constraint overlay",
    blurb: "Survey-fed readiness score per org unit. Units below threshold get a change-management runway inserted before their transformation wave.",
    adds: { attrs: "readiness score per org unit", rules: "low readiness → pre-package", views: "readiness meters + runway package" },
  },
];

/* ---------------- Just-in-time concepts ---------------- */
const CONCEPTS = {
  svc: { title: "Business Service", tag: "ArchiMate 3.2 · TBS Service Inventory", body: "What you just recorded is a Business Service — a final output delivered to a client. It's the same definition the TBS Policy on Service and Digital uses for the GC Service Inventory, so your workbook entries double as reporting prep.", why: "Services are the outward-facing anchor every other concept hangs from." },
  cap: { title: "Business Capability", tag: "TOGAF · Capability-Based Planning", body: "You just mapped a Business Capability — WHAT your organization can do, separate from WHO does it or HOW. Because capabilities are stable while processes churn, they're the level where duplication across branches becomes visible.", why: "Overlap detection and modernization planning both run on capabilities, not org charts." },
  heat: { title: "Gap & Overlap Analysis", tag: "TOGAF ADM · Phase B outputs", body: "This heatmap is a capability duplication analysis: one capability instantiated as separate processes in multiple units. Found mechanically from your entries — not opinion — and every cell traces back to source records.", why: "Evidence of duplication is the classic architecture 'quick win' that funds deeper work." },
  road: { title: "Migration Planning", tag: "TOGAF ADM · Phases E–F", body: "A dependency-sequenced, budget-packed roadmap is what TOGAF calls Opportunities & Solutions and Migration Planning. Each column is a coherent interim state.", why: "In the GoC, an unfunded roadmap is a poster. Waves snap to fiscal years and TB cycles." },
  overlay: { title: "The Overlay Pattern", tag: "Modular extensibility", body: "Modules never modify the core seven entities. Each is an overlay: extra attributes, rules, and views keyed to core IDs — like dimension tables joined to a fact table by foreign key. Install or drop one without touching the core.", why: "This is what keeps the tool from accreting into an unmaintainable monolith." },
  info: { title: "Information Object", tag: "TOGAF · Data Architecture (Phase C)", body: "Pass 3 looks past capabilities and processes to the data itself: an Information Object — like a business register or contact list — touched by multiple processes across units. Even when their capabilities differ, independently building and maintaining separate pipelines to the same underlying data is duplicated integration effort.", why: "Data duplication is invisible in an org chart and invisible in a capability map — it only shows up when you trace the data itself." },
  wp: { title: "Work Package", tag: "TOGAF ADM · Migration Planning artifacts", body: "A Work Package is the atomic funded unit of change in a migration plan — its own cost, benefit, and dependencies on other packages. The roadmap engine topologically sorts by dependency, then greedily packs by benefit-per-dollar into fiscal envelopes. Proposing your own package tests how a real initiative would land against the existing plan.", why: "TB submissions are built from work packages, not capabilities — this is the unit a Treasury analyst actually reads." },
};

/* ---------------- UI atoms ---------------- */
const Chip = ({ children, on, onClick, title }) => (
  <button onClick={onClick} title={title} className="rounded-full border px-3 py-1 text-sm transition-colors"
    style={{ borderColor: on ? C.gold : C.line, background: on ? C.goldSoft : "transparent", color: on ? C.ink : C.mut, fontWeight: on ? 600 : 400 }}>
    {on ? "✓ " : "+ "}{children}
  </button>
);
const Tag = ({ icon: I, children, tone = "gold" }) => {
  const tones = { gold: { bg: C.goldSoft, fg: "#7A5410" }, teal: { bg: C.tealSoft, fg: C.teal }, red: { bg: "#F4E1E6", fg: C.crimson }, ink: { bg: "#E7EAF1", fg: C.ink2 }, violet: { bg: C.violetSoft, fg: C.violet } }[tone];
  return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium" style={{ background: tones.bg, color: tones.fg }}>{I && <I size={12} />}{children}</span>;
};

/* ============================================================ */
export default function CapabilityAtlas() {
  const [std, setStd] = useState(false);
  const [view, setView] = useState("workbook");
  const [services, setServices] = useState(SEED_SERVICES);
  const [processes, setProcesses] = useState(SEED_PROCESSES);
  const [learned, setLearned] = useState([]);
  const [toast, setToast] = useState(null);
  const [fired, setFired] = useState({});
  const [svcName, setSvcName] = useState("");
  const [svcTo, setSvcTo] = useState("");
  const [sel, setSel] = useState(null);
  const [base, setBase] = useState(1200);
  const [mods, setMods] = useState({ cost: false, airead: false, pia: false, change: false });
  const [mergedSem, setMergedSem] = useState({});
  const [flaggedIO, setFlaggedIO] = useState({});
  const [customWPs, setCustomWPs] = useState([]);
  const [wpName, setWpName] = useState("");
  const [wpCost, setWpCost] = useState(200);
  const [wpBenefit, setWpBenefit] = useState(50);
  const [wpDeps, setWpDeps] = useState([]);
  const [wpTouchesPII, setWpTouchesPII] = useState(false);
  const [wpSkillsText, setWpSkillsText] = useState("");

  const mine = UNITS.find((u) => u.mine);
  const mySvcs = services.filter((s) => s.unitId === mine.id);
  const myProcs = processes.filter((p) => p.unitId === mine.id);
  const heatUnlocked = mySvcs.length >= 2 && myProcs.length >= 3;
  const roadUnlocked = heatUnlocked;

  const fire = (key) => {
    if (!fired[key]) { setFired((f) => ({ ...f, [key]: true })); setLearned((l) => [...l, key]); setToast(key); }
  };
  const addService = () => {
    if (!svcName.trim()) return;
    setServices((s) => [...s, { id: "s" + Math.random().toString(36).slice(2, 7), unitId: mine.id, name: svcName.trim(), to: svcTo.trim() || "—" }]);
    setSvcName(""); setSvcTo(""); fire("svc");
  };
  const toggleCap = (svcId, capId) => {
    const existing = myProcs.find((p) => p.capId === capId && p.svcId === svcId);
    if (existing) setProcesses((ps) => ps.filter((p) => p.id !== existing.id));
    else {
      const cap = TAXONOMY.find((c) => c.id === capId);
      setProcesses((ps) => [...ps, { id: "p" + Math.random().toString(36).slice(2, 7), unitId: mine.id, capId, svcId, name: `${mine.short}: ${cap.std.toLowerCase()}`, fte: 1 }]);
      fire("cap");
    }
  };
  const fastForward = () => {
    setServices((s) => [...s.filter((x) => x.unitId !== mine.id), ...FF_SERVICES]);
    setProcesses((p) => [...p.filter((x) => x.unitId !== mine.id), ...FF_PROCESSES]);
    fire("svc"); setTimeout(() => fire("cap"), 50);
  };
  const installMod = (id) => {
    setMods((m) => ({ ...m, [id]: !m[id] }));
    if (!mods[id]) fire("overlay");
  };
  const toggleDep = (id) => setWpDeps((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const addCustomWP = () => {
    if (!wpName.trim()) return;
    const id = "WPU" + Math.random().toString(36).slice(2, 5).toUpperCase();
    setCustomWPs((cs) => [...cs, {
      id, name: wpName.trim(),
      cost: Math.max(50, +wpCost || 200), benefit: Math.min(100, Math.max(1, +wpBenefit || 50)),
      deps: [...wpDeps], skills: wpSkillsText.split(",").map((s) => s.trim()).filter(Boolean),
      touchesPII: wpTouchesPII, kind: "custom",
    }]);
    setWpName(""); setWpCost(200); setWpBenefit(50); setWpDeps([]); setWpTouchesPII(false); setWpSkillsText("");
    fire("wp");
  };
  const removeCustomWP = (id) => setCustomWPs((cs) => cs.filter((w) => w.id !== id));

  /* overlap math */
  const grid = useMemo(() => {
    const cells = {}; let max = 0;
    TAXONOMY.forEach((c) => UNITS.forEach((u) => {
      const list = processes.filter((p) => p.capId === c.id && p.unitId === u.id);
      const fte = list.reduce((a, b) => a + b.fte, 0);
      cells[c.id + u.id] = { fte, list }; max = Math.max(max, fte);
    }));
    const rows = TAXONOMY.map((c) => {
      const units = UNITS.filter((u) => cells[c.id + u.id].fte > 0);
      const totFte = units.reduce((a, u) => a + cells[c.id + u.id].fte, 0);
      const score = Math.max(0, units.length - 1) * totFte;
      const savings = Math.max(0, units.length - 1) * (totFte * FTE_COST + c.om) * 0.35; // ~35% consolidation efficiency
      return { cap: c, nUnits: units.length, totFte, score, savings, mineIn: units.some((u) => u.mine) };
    });
    return { cells, max, rows };
  }, [processes]);

  /* Pass 3: shared Information Objects — data-effort duplication independent of capability match */
  const ioGrid = useMemo(() => {
    return INFO_OBJECTS.map((io) => {
      const links = INFO_LINKS.filter((l) => l.ioId === io.id)
        .map((l) => ({ ...l, proc: processes.find((p) => p.id === l.procId) }))
        .filter((l) => l.proc);
      const unitIds = [...new Set(links.map((l) => l.proc.unitId))];
      const units = unitIds.map((id) => UNITS.find((u) => u.id === id));
      const totFte = links.reduce((a, l) => a + l.proc.fte, 0);
      return { io, links, units, totFte, mineIn: units.some((u) => u.mine) };
    }).filter((r) => r.units.length >= 2);
  }, [processes]);

  const ranked = [...grid.rows].filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  const aiCandidates = [...TAXONOMY].sort((a, b) => b.ready - a.ready);
  const plan = useMemo(() => planRoadmap(base, mods, customWPs), [base, mods, customWPs]);
  const activeModCount = Object.values(mods).filter(Boolean).length;

  const T = {
    service: std ? "Business Services" : "Things you deliver",
    serviceOne: std ? "Business Service" : "something you deliver",
    cap: std ? "Business Capabilities" : "Things you must be able to do",
    heat: std ? "Gap & Overlap Analysis" : "Overlap Heatmap",
    road: std ? "Migration Plan (ADM E–F)" : "Transition Roadmap",
  };
  const unlocks = [
    { label: "Unit Service Map", need: "Record 2 services for your unit", done: mySvcs.length >= 2, prog: `${Math.min(mySvcs.length, 2)}/2` },
    { label: T.heat, need: "Map 3 capabilities to your services", done: heatUnlocked, prog: `${Math.min(myProcs.length, 3)}/3` },
    { label: T.road, need: "Unlocks with the heatmap", done: roadUnlocked, prog: roadUnlocked ? "✓" : "—" },
  ];
  const NAV = [
    { id: "workbook", label: "Workbook", icon: NotebookPen, locked: false },
    { id: "heatmap", label: T.heat, icon: Grid3x3, locked: !heatUnlocked },
    { id: "roadmap", label: T.road, icon: Route, locked: !roadUnlocked },
    { id: "modules", label: `Modules${activeModCount ? " · " + activeModCount : ""}`, icon: Puzzle, locked: false },
    { id: "glossary", label: `Glossary (${learned.length})`, icon: BookOpen, locked: false },
  ];
  const openView = (id, locked) => {
    setView(id);
    if (!locked && id === "heatmap") { fire("heat"); setTimeout(() => fire("info"), 400); }
    if (!locked && id === "roadmap") fire("road");
    if (id === "modules") fire("overlay");
  };

  /* ============================ RENDER ============================ */
  return (
    <div style={{ background: C.paper, minHeight: "100dvh", color: C.ink, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
        button:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        input::placeholder { color: #9AA1AE; }
      `}</style>

      {/* Header */}
      <header className="border-b" style={{ background: C.ink, borderColor: C.ink }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded" style={{ background: C.gold, color: C.ink }}><Grid3x3 size={17} strokeWidth={2.5} /></div>
            <div>
              <div className="text-base font-bold leading-tight" style={{ color: "#FFF" }}>Capability Atlas</div>
              <div className="mono text-xs" style={{ color: "#A8B2C6" }}>EBA workbook · national statistical agency · demo</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: "#A8B2C6" }}>Labels:</span>
            <div className="flex overflow-hidden rounded-full border" style={{ borderColor: "#3C4C6B" }}>
              {["Plain", "Standard"].map((m, i) => (
                <button key={m} onClick={() => setStd(i === 1)} className="px-3 py-1 text-xs font-semibold"
                  style={{ background: std === (i === 1) ? C.gold : "transparent", color: std === (i === 1) ? C.ink : "#A8B2C6" }}>{m}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => openView(n.id, n.locked)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-t px-3 py-2 text-sm font-medium"
              style={{ background: view === n.id ? C.paper : "transparent", color: view === n.id ? C.ink : n.locked ? "#5E6C88" : "#C9D1E0" }}>
              {n.locked ? <Lock size={13} /> : <n.icon size={14} />} {n.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 lg:flex-row">
        {/* Unlock rail */}
        <aside className="shrink-0 lg:w-60">
          <div className="rounded-lg border p-4" style={{ borderColor: C.line, background: C.card }}>
            <div className="mono mb-3 text-xs font-medium uppercase tracking-wide" style={{ color: C.mut }}>Insight unlocks</div>
            <div className="flex flex-col">
              {unlocks.map((u, i) => (
                <div key={u.label} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < unlocks.length - 1 && <div className="absolute left-[11px] top-6 h-full w-0.5" style={{ background: u.done ? C.gold : C.line }} />}
                  <div className="z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2" style={{ borderColor: u.done ? C.gold : C.line, background: u.done ? C.gold : C.card, color: u.done ? C.ink : C.mut }}>
                    {u.done ? <Check size={13} strokeWidth={3} /> : <Lock size={11} />}
                  </div>
                  <div><div className="text-sm font-semibold" style={{ color: u.done ? C.ink : C.mut }}>{u.label}</div>
                    <div className="text-xs" style={{ color: C.mut }}>{u.done ? "Unlocked" : u.need} <span className="mono">· {u.prog}</span></div></div>
                </div>
              ))}
            </div>
            {!heatUnlocked && (
              <button onClick={fastForward} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold" style={{ background: C.ink, color: "#FFF" }}>
                <Sparkles size={14} /> Fast-forward with sample data
              </button>
            )}
          </div>

          {/* installed overlays mini-panel */}
          <div className="mt-3 rounded-lg border p-4" style={{ borderColor: C.line, background: C.card }}>
            <div className="mono mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: C.mut }}><Layers size={12} /> Installed overlays</div>
            {activeModCount === 0 && <div className="text-xs" style={{ color: C.mut }}>None yet. Visit <b style={{ color: C.ink }}>Modules</b> to plug capabilities into the core.</div>}
            <div className="flex flex-col gap-1.5">
              {MODULES.filter((m) => mods[m.id]).map((m) => (
                <div key={m.id} className="flex items-center gap-1.5 text-xs font-semibold"><m.icon size={13} style={{ color: C[m.tone] }} /> {m.name}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* WORKBOOK */}
          {view === "workbook" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <div className="mono text-xs font-medium uppercase tracking-wide" style={{ color: C.gold }}>Step 1</div>
                <h2 className="mt-1 text-lg font-bold">{T.service}</h2>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>What does your team produce or deliver, and who receives it? Plain words are fine — the workbook handles the formal filing.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input value={svcName} onChange={(e) => setSvcName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addService()} placeholder="e.g., Monthly Labour Market Bulletin" className="flex-1 rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  <input value={svcTo} onChange={(e) => setSvcTo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addService()} placeholder="Who receives it?" className="rounded-md border px-3 py-2 text-sm sm:w-48" style={{ borderColor: C.line, background: C.paper }} />
                  <button onClick={addService} className="flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-semibold" style={{ background: C.gold, color: C.ink }}><Plus size={15} /> Add</button>
                </div>
              </div>
              {mySvcs.length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: C.line, color: C.mut }}>Nothing recorded for {mine.short} yet. Add your first {T.serviceOne} above — the sidebar shows what each entry unlocks.</div>}
              {mySvcs.map((s) => (
                <div key={s.id} className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                  <div className="flex flex-wrap items-baseline gap-2"><h3 className="text-base font-bold">{s.name}</h3><span className="mono text-xs" style={{ color: C.mut }}>→ {s.to}</span></div>
                  <div className="mono mt-3 text-xs font-medium uppercase tracking-wide" style={{ color: C.gold }}>Step 2 · {T.cap}</div>
                  <p className="mt-1 text-sm" style={{ color: C.mut }}>To deliver this, what must your team <i>be able to do</i>? Pick from the starter taxonomy (verbs, not job titles):</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TAXONOMY.map((c) => {
                      const on = !!myProcs.find((p) => p.capId === c.id && p.svcId === s.id);
                      return <Chip key={c.id} on={on} onClick={() => toggleCap(s.id, c.id)} title={std ? c.plain : c.std}>{std ? c.std : c.plain}</Chip>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HEATMAP */}
          {view === "heatmap" && !heatUnlocked && <LockedPanel need="Record 2 services and 3 capabilities for your unit in the Workbook — or use Fast-forward." />}
          {view === "heatmap" && heatUnlocked && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <h2 className="text-lg font-bold">{T.heat}</h2>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Rows are capabilities; columns are org units; intensity is effort (FTE). Any capability in <b>2+ columns</b> is structural duplication — click a cell to trace it. {mods.airead && <span style={{ color: C.violet }}>The <b>AI</b> column is your installed AI-Readiness overlay.</span>}</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-separate" style={{ borderSpacing: 3, minWidth: mods.airead ? 620 : 560 }}>
                    <thead><tr>
                      <th></th>
                      {UNITS.map((u) => <th key={u.id} className="mono pb-1 text-center text-xs font-medium" style={{ color: u.mine ? C.gold : C.mut }}>{u.short}{u.mine ? " (you)" : ""}</th>)}
                      {mods.airead && <th className="mono pb-1 text-center text-xs font-medium" style={{ color: C.violet }}>AI</th>}
                      <th className="mono pb-1 pl-2 text-right text-xs font-medium" style={{ color: C.mut }}>{mods.cost ? "save/yr" : "score"}</th>
                    </tr></thead>
                    <tbody>
                      {grid.rows.map(({ cap, nUnits, score, savings, mineIn }) => (
                        <tr key={cap.id}>
                          <td className="max-w-40 pr-2 text-sm font-medium leading-tight">{std ? cap.std : cap.plain}
                            {nUnits >= 2 && mineIn && myProcs.some((p) => p.capId === cap.id) && <span className="ml-1 align-middle"><Tag tone="red">overlap</Tag></span>}</td>
                          {UNITS.map((u) => {
                            const cell = grid.cells[cap.id + u.id]; const t = grid.max ? cell.fte / grid.max : 0;
                            const active = sel && sel.capId === cap.id && sel.unitId === u.id;
                            return <td key={u.id}><button onClick={() => setSel(cell.fte ? { capId: cap.id, unitId: u.id } : null)} className="mono h-9 w-full rounded text-xs font-medium"
                              style={{ background: cell.fte ? heat(0.15 + 0.85 * t) : "#FBFAF6", color: t > 0.45 ? "#FFF" : cell.fte ? C.ink : C.line, border: active ? `2px solid ${C.gold}` : `1px solid ${cell.fte ? "transparent" : C.line}`, cursor: cell.fte ? "pointer" : "default" }}>
                              {cell.fte || "·"}</button></td>;
                          })}
                          {mods.airead && <td><div className="mono grid h-9 place-items-center rounded text-xs font-semibold" style={{ background: ai(cap.ready / 100), color: cap.ready > 55 ? "#FFF" : C.violet }}>{cap.ready}</div></td>}
                          <td className="mono pl-2 text-right text-xs" style={{ color: score > 0 ? C.crimson : C.line, fontWeight: score > 0 ? 600 : 400 }}>
                            {score > 0 ? (mods.cost ? fmtK(Math.round(savings)) : score.toFixed(1)) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mono mt-2 text-xs" style={{ color: C.mut }}>{mods.cost ? "save/yr = est. annual saving from consolidating (≈35% of duplicated FTE + O&M cost)" : "score = (units performing − 1) × total FTE · install Cost & Effort to dollarize"}</div>
              </div>

              {sel && (() => {
                const cap = TAXONOMY.find((c) => c.id === sel.capId); const unit = UNITS.find((u) => u.id === sel.unitId); const cell = grid.cells[sel.capId + sel.unitId];
                return (
                  <div className="rounded-lg border p-4" style={{ borderColor: C.gold, background: C.card }}>
                    <div className="flex items-start justify-between"><div className="text-sm font-bold">{std ? cap.std : cap.plain} · {unit.name}</div><button onClick={() => setSel(null)} style={{ color: C.mut }}><X size={16} /></button></div>
                    {cell.list.map((p) => <div key={p.id} className="mono mt-2 flex justify-between rounded border px-3 py-1.5 text-xs" style={{ borderColor: C.line, background: C.paper }}><span>{p.name}</span><span style={{ color: C.mut }}>{p.fte} FTE{mods.cost ? ` · ${fmtK(p.fte * FTE_COST)}` : ""}</span></div>)}
                  </div>
                );
              })()}

              {/* Pass 2 semantic matching */}
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <div className="flex items-center gap-2"><Link2 size={16} style={{ color: C.teal }} /><h3 className="text-base font-bold">Semantic near-duplicates</h3><Tag tone="teal">Pass 2</Tag></div>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Structural matching misses processes described in different words. Text-embedding similarity surfaces these <i>candidates</i> — never auto-merged. You confirm; the taxonomy learns.</p>
                {SEMANTIC.map((m, i) => (
                  <div key={i} className="mt-3 flex flex-wrap items-center gap-2 rounded-md border p-3" style={{ borderColor: C.line }}>
                    <span className="mono text-xs font-semibold" style={{ color: C.teal }}>{(m.sim * 100).toFixed(0)}%</span>
                    <span className="text-sm">{m.a}</span><span style={{ color: C.mut }}>≈</span><span className="text-sm">{m.b}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {mergedSem[i] ? <Tag icon={Check} tone="teal">merged → {m.cap}</Tag> :
                        <button onClick={() => setMergedSem((s) => ({ ...s, [i]: true }))} className="rounded-md border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.teal, color: C.teal }}>Confirm merge</button>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pass 3 shared information objects */}
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <div className="flex items-center gap-2"><Database size={16} style={{ color: C.gold }} /><h3 className="text-base font-bold">Shared data duplication</h3><Tag tone="gold">Pass 3</Tag></div>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Passes 1–2 match on capability and process text. Pass 3 traces the underlying <b>Information Object</b> — when units independently build pipelines to the same data, that's duplicated integration effort even if their capabilities never overlap.</p>
                {ioGrid.length === 0 && <div className="mt-3 text-sm" style={{ color: C.mut }}>No shared information objects detected yet.</div>}
                {ioGrid.map((r) => (
                  <div key={r.io.id} className="mt-3 rounded-md border p-3" style={{ borderColor: C.line }}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold">{r.io.name} <span className="mono text-xs font-normal" style={{ color: C.mut }}>· {r.units.length} units · {r.totFte} FTE</span></div>
                        <div className="mt-0.5 text-xs" style={{ color: C.mut }}>{r.io.desc}</div>
                      </div>
                      {flaggedIO[r.io.id] ? <Tag icon={Check} tone="gold">flagged for review</Tag> :
                        <button onClick={() => setFlaggedIO((s) => ({ ...s, [r.io.id]: true }))} className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.gold, color: "#7A5410" }}>Flag for shared-service review</button>}
                    </div>
                    <div className="mt-2 flex flex-col gap-1.5">
                      {r.links.map((l) => {
                        const cap = TAXONOMY.find((c) => c.id === l.proc.capId);
                        const unit = UNITS.find((u) => u.id === l.proc.unitId);
                        return (
                          <div key={l.procId} className="mono flex flex-wrap items-center gap-2 rounded border px-3 py-1.5 text-xs" style={{ borderColor: C.line, background: C.paper }}>
                            <span style={{ color: unit.mine ? C.gold : C.ink, fontWeight: 600 }}>{unit.short}</span>
                            <span style={{ color: C.mut }}>{l.role}</span>
                            <span>{l.proc.name}</span>
                            <span style={{ color: C.mut }}>({std ? cap.std : cap.plain})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <h3 className="text-base font-bold">Top consolidation candidates</h3>
                {ranked.slice(0, 3).map((r, i) => (
                  <div key={r.cap.id} className="mt-3 flex items-start gap-3 rounded-md border p-3" style={{ borderColor: C.line }}>
                    <div className="mono text-lg font-semibold" style={{ color: C.crimson }}>{i + 1}</div>
                    <div className="text-sm"><b>{std ? r.cap.std : r.cap.plain}</b> runs as {r.nUnits} separate processes across {r.nUnits} units ({r.totFte} FTE).
                      {mods.cost && <span style={{ color: C.teal }}> Est. <b>{fmtK(Math.round(r.savings))}/yr</b> recoverable.</span>}
                      <span style={{ color: C.mut }}> Framed for executives: the service traverses {r.nUnits} units and duplicates this capability {r.nUnits}×.</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROADMAP */}
          {view === "roadmap" && !roadUnlocked && <LockedPanel need="Unlocks together with the heatmap — complete the Workbook first." />}
          {view === "roadmap" && roadUnlocked && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <h2 className="text-lg font-bold">{T.road}</h2>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Topological sort by dependency, then benefit-per-dollar packing into fiscal envelopes. Decommissioning savings credit later years. {(mods.pia || mods.change) && <span style={{ color: C.violet }}>Installed overlays have <b>injected packages</b> into the plan — look for the dashed cards.</span>}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="mono text-xs font-medium" style={{ color: C.mut }}>ANNUAL ENVELOPE</span>
                  <input type="range" min={600} max={1800} step={100} value={base} onChange={(e) => setBase(+e.target.value)} className="w-48" style={{ accentColor: C.gold }} />
                  <span className="mono text-sm font-semibold">{fmtK(base)} / yr</span>
                </div>
              </div>

              {/* propose a work package */}
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <h3 className="text-base font-bold">Propose a work package</h3>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Add your own package with cost, benefit, and dependencies — it slots into the same topological sort and fiscal-envelope packing as the base plan.</p>
                <div className="mt-3 flex flex-col gap-2">
                  <input value={wpName} onChange={(e) => setWpName(e.target.value)} placeholder="e.g., Modernize disclosure control tooling" className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-1.5 text-xs" style={{ color: C.mut }}>Cost ($K/yr)
                      <input type="number" min={50} step={50} value={wpCost} onChange={(e) => setWpCost(e.target.value)} className="mono w-24 rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs" style={{ color: C.mut }}>Benefit (0–100)
                      <input type="number" min={1} max={100} value={wpBenefit} onChange={(e) => setWpBenefit(e.target.value)} className="mono w-20 rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs" style={{ color: C.mut }}>
                      <input type="checkbox" checked={wpTouchesPII} onChange={(e) => setWpTouchesPII(e.target.checked)} /> Touches personal information
                    </label>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium" style={{ color: C.mut }}>Depends on</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(plan.byId).map((w) => (
                        <Chip key={w.id} on={wpDeps.includes(w.id)} onClick={() => toggleDep(w.id)}>{w.id}</Chip>
                      ))}
                    </div>
                  </div>
                  <input value={wpSkillsText} onChange={(e) => setWpSkillsText(e.target.value)} placeholder="Skills needed, comma-separated (optional)" className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  <button onClick={addCustomWP} className="flex w-fit items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-semibold" style={{ background: C.gold, color: C.ink }}><Plus size={15} /> Add package</button>
                </div>
                {customWPs.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {customWPs.map((w) => (
                      <div key={w.id} className="mono flex items-center justify-between gap-2 rounded border px-3 py-1.5 text-xs" style={{ borderColor: C.gold, background: C.goldSoft }}>
                        <span>{w.id} · {w.name} · {fmtK(w.cost)} · benefit {w.benefit}{w.deps.length ? ` · needs ${w.deps.join(", ")}` : ""}</span>
                        <button onClick={() => removeCustomWP(w.id)} style={{ color: "#7A5410" }} aria-label={`Remove ${w.id}`}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {YEARS.map((yr, y) => {
                  const wave = plan.waves[y]; const spent = wave.reduce((a, w) => a + w.cost, 0); const envelope = base + plan.boosts[y];
                  return (
                    <div key={yr} className="flex flex-col rounded-lg border" style={{ borderColor: C.line, background: C.card }}>
                      <div className="border-b px-3 py-2" style={{ borderColor: C.line, background: C.ink, borderRadius: "7px 7px 0 0" }}>
                        <div className="mono text-xs font-semibold" style={{ color: C.gold }}>WAVE {y + 1} · {yr}</div>
                        <div className="mono mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#33425F" }}><div className="h-full" style={{ width: `${Math.min(100, (spent / envelope) * 100)}%`, background: C.gold }} /></div>
                        <div className="mono mt-1 text-[11px]" style={{ color: "#A8B2C6" }}>{fmtK(spent)} of {fmtK(envelope)}{plan.boosts[y] > 0 && <span style={{ color: "#7FC6BE" }}> (+{fmtK(plan.boosts[y])} freed)</span>}</div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2">
                        {wave.length === 0 && <div className="p-2 text-xs" style={{ color: C.mut }}>No packages fit this wave.</div>}
                        {wave.map((w) => (
                          <div key={w.id} className="rounded-md p-2.5" style={{ border: w.injected ? `1.5px dashed ${C.violet}` : w.kind === "custom" ? `1.5px solid ${C.gold}` : `1px solid ${w.kind === "retire" ? C.teal : C.line}`, background: w.injected ? C.violetSoft : w.kind === "custom" ? C.goldSoft : w.kind === "retire" ? C.tealSoft : C.paper }}>
                            <div className="mono text-[11px] font-semibold" style={{ color: w.injected ? C.violet : w.kind === "custom" ? "#7A5410" : C.mut }}>{w.id} · {fmtK(w.cost)}{w.injected ? " · overlay" : w.kind === "custom" ? " · yours" : ""}</div>
                            <div className="mt-0.5 text-sm font-semibold leading-tight">{w.name}</div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {w.deps.map((d) => <Tag key={d} tone="ink">needs {d}</Tag>)}
                              {w.pia && <Tag icon={ShieldAlert} tone="red">PIA required</Tag>}
                              {mods.airead && w.capId && <Tag icon={Cpu} tone="violet">AI-ready {TAXONOMY.find((c) => c.id === w.capId)?.ready}</Tag>}
                              {w.savings && <Tag icon={Recycle} tone="teal">frees {fmtK(w.savings)}/yr</Tag>}
                              {w.skills.map((s) => <Tag key={s} icon={GraduationCap} tone="gold">{s}</Tag>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {plan.deferred.length > 0 && (
                <div className="rounded-lg border p-4" style={{ borderColor: C.crimson, background: "#FBF3F5" }}>
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: C.crimson }}><Flag size={15} /> Deferred beyond the planning horizon</div>
                  {plan.deferred.map(({ w, reason }) => <div key={w.id} className="mt-2 text-sm"><b className="mono">{w.id}</b> {w.name} — <span style={{ color: C.mut }}>{reason}. Raise the envelope, or let decommissioning savings compound.</span></div>)}
                </div>
              )}
              <div className="rounded-lg border p-4 text-sm leading-relaxed" style={{ borderColor: C.line, background: C.card, color: C.mut }}>
                <b style={{ color: C.ink }}>Reading this like a TB submission:</b> each wave is a coherent interim state with its own off-ramp. Retirement packages (teal) pass a parallel-run cutover gate before legacy processes are archived; released savings appear as <span className="mono" style={{ color: C.teal }}>+freed</span> in later envelopes — the partially self-funding narrative. Dashed <span style={{ color: C.violet }}>overlay</span> cards are inserted by installed modules, not the base plan.
              </div>
            </div>
          )}

          {/* MODULES */}
          {view === "modules" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <div className="flex items-center gap-2"><Puzzle size={18} style={{ color: C.gold }} /><h2 className="text-lg font-bold">Overlay modules</h2></div>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Each module plugs into the lean seven-entity core by ID — adding attributes, rules, and views without changing the core itself. Toggle one and watch the Heatmap and Roadmap react. Think fact table (core) + dimension tables (modules) joined by foreign key.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {MODULES.map((m) => {
                  const on = mods[m.id];
                  return (
                    <div key={m.id} className="flex flex-col rounded-lg border p-4" style={{ borderColor: on ? C[m.tone] : C.line, background: C.card }}>
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded" style={{ background: on ? C[m.tone] : C.paper, color: on ? "#FFF" : C[m.tone] }}><m.icon size={18} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><span className="text-base font-bold">{m.name}</span><Tag tone={m.tone}>{m.wave}</Tag></div>
                          <div className="mono text-xs" style={{ color: C.mut }}>{m.tag}</div>
                        </div>
                        <button onClick={() => installMod(m.id)} className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: on ? C[m.tone] : "transparent", color: on ? "#FFF" : C[m.tone], border: `1.5px solid ${C[m.tone]}` }}>
                          {on ? "Installed ✓" : "Install"}
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed">{m.blurb}</p>
                      <div className="mono mt-3 grid gap-1 rounded-md border p-2.5 text-[11px]" style={{ borderColor: C.line, background: C.paper, color: C.mut }}>
                        <div><b style={{ color: C.ink }}>+ attributes:</b> {m.adds.attrs}</div>
                        <div><b style={{ color: C.ink }}>+ rules:</b> {m.adds.rules}</div>
                        <div><b style={{ color: C.ink }}>+ views:</b> {m.adds.views}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {mods.change && (
                <div className="rounded-lg border p-5" style={{ borderColor: C.teal, background: C.card }}>
                  <div className="flex items-center gap-2"><HeartHandshake size={16} style={{ color: C.teal }} /><h3 className="text-base font-bold">Org-unit change-readiness</h3></div>
                  <p className="mt-1 text-sm" style={{ color: C.mut }}>Units below 50 get a change-management runway inserted before their wave (see the dashed <span style={{ color: C.violet }}>WP-CM</span> card in the Roadmap).</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {UNITS.map((u) => (
                      <div key={u.id} className="flex items-center gap-2">
                        <span className="mono w-32 text-xs" style={{ color: u.mine ? C.gold : C.ink }}>{u.short}{u.mine ? " (you)" : ""}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: C.line }}><div className="h-full" style={{ width: `${u.ready}%`, background: u.ready < 50 ? C.crimson : C.teal }} /></div>
                        <span className="mono text-xs font-semibold" style={{ color: u.ready < 50 ? C.crimson : C.teal }}>{u.ready}{u.ready < 50 ? " ⚑" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mods.pia && (
                <div className="rounded-lg border p-5" style={{ borderColor: C.crimson, background: C.card }}>
                  <div className="flex items-center gap-2"><ShieldAlert size={16} style={{ color: C.crimson }} /><h3 className="text-base font-bold">PIA compliance triggers</h3></div>
                  <p className="mt-1 text-sm" style={{ color: C.mut }}>The rule <span className="mono" style={{ color: C.crimson }}>AI package touches personal-info capability → PIA required</span> fired on {activeWPs(mods).filter((w) => w.pia).length} package(s). A PIA task was injected as a dependency ahead of the first AI wave.</p>
                </div>
              )}
            </div>
          )}

          {/* GLOSSARY */}
          {view === "glossary" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
                <h2 className="text-lg font-bold">Your framework glossary</h2>
                <p className="mt-1 text-sm" style={{ color: C.mut }}>Concepts you've earned by building, not by reading a manual first. Your organically-assembled TOGAF/ArchiMate reference.</p>
              </div>
              {learned.length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: C.line, color: C.mut }}>Empty so far. Add a service in the Workbook to earn your first concept.</div>}
              {learned.map((k) => { const c = CONCEPTS[k]; return (
                <div key={k} className="rounded-lg border p-4" style={{ borderColor: C.line, background: C.card }}>
                  <div className="flex flex-wrap items-center gap-2"><span className="text-base font-bold">{c.title}</span><Tag tone="ink">{c.tag}</Tag></div>
                  <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
                  <p className="mt-2 text-sm" style={{ color: C.teal }}><b>Why it matters:</b> {c.why}</p>
                </div>
              ); })}
            </div>
          )}
        </main>
      </div>

      {/* Just-in-time toast */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border p-4 shadow-lg" style={{ background: C.ink, borderColor: C.gold, color: "#EDF0F6" }}>
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: C.gold, color: C.ink }}><Info size={16} /></div>
            <div className="min-w-0">
              <div className="text-sm font-bold" style={{ color: C.gold }}>{CONCEPTS[toast].title} <span className="mono text-xs font-normal" style={{ color: "#A8B2C6" }}>· {CONCEPTS[toast].tag}</span></div>
              <p className="mt-1 text-sm leading-relaxed">{CONCEPTS[toast].body}</p>
              <button onClick={() => { setToast(null); setView("glossary"); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.gold }}>Saved to your glossary <ChevronRight size={13} /></button>
            </div>
            <button onClick={() => setToast(null)} style={{ color: "#A8B2C6" }} aria-label="Dismiss"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );

  function LockedPanel({ need }) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed p-10 text-center" style={{ borderColor: C.line, background: C.card }}>
        <Lock size={22} style={{ color: C.mut }} />
        <div className="mt-2 text-sm font-semibold">This insight isn't unlocked yet</div>
        <div className="mt-1 max-w-sm text-sm" style={{ color: C.mut }}>{need}</div>
      </div>
    );
  }
}
