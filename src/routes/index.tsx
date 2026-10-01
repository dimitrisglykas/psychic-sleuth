import { createFileRoute } from "@tanstack/react-router";
import { Clock3, FolderOpen, Gavel, Lightbulb, MessageSquareQuote, Search, Sparkles as _unused, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccuseModal } from "@/components/game/accuse";
import { CrimeScene } from "@/components/game/crime-scene";
import { Interrogation, type Meta } from "@/components/game/interrogation";
import { Cases, HintShop, HowToPlay, Intuition, SeasonPass } from "@/components/game/overlays";
import { Eyebrow, Rich, StressBar, stressLabel } from "@/components/game/ui";
import { clueById, clues, START_CLUES, SUSPECT_IDS, suspects, type ClueId, type SuspectId } from "@/game/case";

void _unused;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "The Enigma at Blackwood Manor — Psychic Sleuth" },
    { name: "description", content: "Question three AI suspects, search the crime scene and solve the murder at Blackwood Manor." },
    { property: "og:title", content: "The Enigma at Blackwood Manor — Psychic Sleuth" },
    { property: "og:description", content: "Question every alibi. Read every tell. Name the killer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MysteryGame,
});

type OverlayKind = null | "intro" | "cases" | "scene" | "accuse" | "shop" | "pass";
const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } };
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

function MysteryGame() {
  const [suspectId, setSuspectId] = useState<SuspectId>("partner");
  const [meta, setMeta] = useState<Partial<Record<SuspectId, Meta>>>({});
  const [counts, setCounts] = useState<Partial<Record<SuspectId, number>>>({});
  const [found, setFound] = useState<ClueId[]>(START_CLUES);
  const [hints, setHints] = useState(3);
  const [overlay, setOverlay] = useState<OverlayKind>(null);
  const [intuition, setIntuition] = useState<string | null>(null);
  const [injected, setInjected] = useState<{ id: ClueId; n: number } | null>(null);
  const [discovered, setDiscovered] = useState<ClueId | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    setMeta(load("blackwood-meta", {})); setFound(load("blackwood-found", START_CLUES)); setHints(load("blackwood-hints", 3));
    const c: Partial<Record<SuspectId, number>> = {};
    for (const id of SUSPECT_IDS) c[id] = load<{ role: string }[]>(`blackwood-chat-${id}`, []).filter((m) => m.role === "user").length;
    setCounts(c);
    const s = load<number | null>("blackwood-started", null) ?? Date.now(); save("blackwood-started", s); setStartedAt(s);
    if (!load("blackwood-intro", false)) setOverlay("intro");
  }, []);

  const suspect = suspects[suspectId];
  const stressOf = (id: SuspectId) => meta[id]?.stress ?? suspects[id].stress;
  const questioned = SUSPECT_IDS.filter((id) => (counts[id] ?? 0) > 0);
  const guiding = !(counts.partner ?? 0) && suspectId === "partner";

  const updateMeta = (m: Meta) => setMeta((prev) => { const next = { ...prev, [suspectId]: m } as Partial<Record<SuspectId, Meta>>; save("blackwood-meta", next); return next; });
  const useClue = (id: ClueId) => setInjected({ id, n: Date.now() });
  const discover = (id: ClueId) => { setFound((f) => { const next = f.includes(id) ? f : [...f, id]; save("blackwood-found", next); return next; }); setDiscovered(id); window.setTimeout(() => setDiscovered(null), 2600); };
  const switchSuspect = (id: SuspectId) => { setSuspectId(id); setInjected(null); };
  const jane = () => {
    const m = meta[suspectId];
    if (hints <= 0) { setOverlay("shop"); return; }
    if (!m?.tell) { setIntuition(`Ask ${suspect.short} something first — even Jane needs a reaction to read.`); return; }
    const next = hints - 1; setHints(next); save("blackwood-hints", next);
    setIntuition(`${m.observation ? `"${m.observation}." ` : ""}${m.tell}`);
  };
  const restart = () => { Object.keys(localStorage).filter((k) => k.startsWith("blackwood-") && k !== "blackwood-intro").forEach((k) => localStorage.removeItem(k)); window.location.reload(); };

  const left = clues.length - found.length;
  const objective = !(counts.partner ?? 0) ? "Ask **Julian** about the altered ledger — tap the **ledger clue** below."
    : left > 0 ? `Search the **crime scene** — **${left} hidden clue${left > 1 ? "s" : ""}** left.`
    : questioned.length < 3 ? `Question **${SUSPECT_IDS.filter((id) => !questioned.includes(id)).map((id) => suspects[id].short).join(" and ")}** to catch a lie.`
    : "You have everything you need. **Solve the case.**";
  const progress = Math.round(((found.length / clues.length) + (questioned.length / 3)) / 2 * 100);

  const clueButtons = (compact: boolean) => found.map((id) => {
    const c = clueById(id); const guide = guiding && id === "invoice";
    return <button key={id} onClick={() => useClue(id)} title={c.title} aria-label={`Ask about ${c.title}`} className={`relative flex shrink-0 items-center gap-2 rounded-sm border bg-panel-raised text-left transition-colors hover:border-primary/60 hover:bg-accent ${compact ? "p-2" : "w-full p-2.5"} ${guide ? "guide-ring border-primary" : ""}`}>
      <c.icon className="size-4 shrink-0 text-primary" />
      {compact ? <span className="text-[11px] font-medium">{c.title}</span> : <span className="min-w-0"><span className="block text-xs font-semibold">{c.title}</span><span className="block text-[11px] leading-4 text-muted-foreground"><Rich text={c.detail} /></span></span>}
      {guide && <span className="absolute -top-7 left-0 whitespace-nowrap rounded-sm bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Tap to ask Julian about this</span>}
    </button>;
  });

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      <header className="flex min-h-14 items-center gap-3 border-b bg-panel px-4 lg:px-6">
        <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">Psychic Sleuth · Case 001</p><h1 className="truncate font-display text-lg sm:text-xl">The Enigma at Blackwood Manor</h1></div>
        <Timer startedAt={startedAt} />
        <Button variant="ghost" size="sm" onClick={() => setOverlay("cases")}><FolderOpen /> <span className="hidden sm:inline">Cases</span></Button>
      </header>

      <div className="flex items-center gap-3 border-b bg-accent/40 px-4 py-2 lg:px-6">
        <Target className="size-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-xs sm:text-sm"><span className="font-semibold uppercase tracking-[.12em] text-primary">Goal: </span><Rich text={objective} /></p>
        <div className="hidden w-32 items-center gap-2 sm:flex"><div className="h-1 flex-1 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><span className="font-mono text-[10px]">{progress}%</span></div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* Left: suspect */}
        <aside className="min-h-0 border-b bg-panel lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="relative hidden aspect-[4/3] overflow-hidden lg:block"><img src={suspect.image} alt={suspect.name} className="h-full w-full object-cover object-[center_28%]" width={768} height={1024} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-panel to-transparent p-4 pt-16"><p className="font-display text-2xl">{suspect.name}</p><p className="text-[10px] uppercase tracking-[.18em] text-primary">{suspect.role}</p></div></div>
          <div className="flex gap-2 overflow-x-auto p-3 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {SUSPECT_IDS.map((id) => <button key={id} onClick={() => switchSuspect(id)} className={`flex min-w-[112px] items-center gap-2 rounded-sm border p-1.5 text-left lg:min-w-0 lg:flex-col lg:items-stretch ${id === suspectId ? "border-primary bg-accent" : "opacity-70 hover:opacity-100"}`}>
              <img src={suspects[id].image} alt="" className="size-9 rounded-full object-cover object-top lg:aspect-square lg:size-auto lg:w-full lg:rounded-sm" width={768} height={1024} loading="lazy" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{suspects[id].short}</span><StressBar value={stressOf(id)} thin /></span>
            </button>)}
          </div>
          <div className="hidden space-y-4 px-4 pb-5 lg:block">
            <div><div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[.16em]"><span>Stress</span><span className="text-primary">{stressOf(suspectId)}% · {stressLabel(stressOf(suspectId))}</span></div><StressBar value={stressOf(suspectId)} /></div>
            <Info label="Who" text={`${suspect.age} · ${suspect.bio}`} /><Info label="Alibi" text={suspect.alibi} /><Info label="Possible motive" text={suspect.motive} />
          </div>
        </aside>

        {/* Center: interrogation */}
        <Interrogation key={suspectId} suspectId={suspectId} stress={stressOf(suspectId)} injected={injected} onMeta={updateMeta}
          onCount={(n) => setCounts((c) => (c[suspectId] === n ? c : { ...c, [suspectId]: n }))}
          header={<div className="flex items-center justify-between border-b px-4 py-2.5"><p className="text-xs"><span className="font-semibold">Questioning {suspect.name}</span> <span className="text-muted-foreground lg:hidden">· stress {stressOf(suspectId)}%</span></p><p className="flex items-center gap-1 text-[10px] text-success"><span className="size-1.5 rounded-full bg-success" /> Recording</p></div>}
          clueStrip={<div className="mx-auto mb-2 flex max-w-2xl gap-2 overflow-x-auto pb-1 pt-7 lg:hidden">{clueButtons(true)}<button onClick={() => setOverlay("scene")} className="flex shrink-0 items-center gap-1.5 rounded-sm border border-dashed border-primary/60 p-2 text-[11px] text-primary"><Search className="size-4" /> Crime scene</button></div>}
        />

        {/* Right: clues & actions */}
        <aside className="hidden min-h-0 flex-col overflow-y-auto border-l bg-panel lg:flex">
          <div className="border-b p-4"><Button className="h-11 w-full" onClick={() => setOverlay("scene")}><Search /> Inspect crime scene</Button></div>
          <div className="space-y-2 p-4 pt-9"><Eyebrow>Clues · tap to ask</Eyebrow>{clueButtons(false)}{left > 0 && <p className="rounded-sm border border-dashed p-2.5 text-[11px] text-muted-foreground">{left} more clue{left > 1 ? "s" : ""} hidden at the crime scene.</p>}</div>
          <div className="mt-auto space-y-3 border-t p-4">
            <Eyebrow>Case progress</Eyebrow>
            <Row label="Clues found" value={`${found.length} / ${clues.length}`} /><Row label="Suspects questioned" value={`${questioned.length} / 3`} />
            {SUSPECT_IDS.map((id) => <div key={id}><div className="mb-1 flex justify-between text-[11px]"><span>{suspects[id].short}</span><span className="font-mono text-muted-foreground">{stressOf(id)}%</span></div><StressBar value={stressOf(id)} thin /></div>)}
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 z-30 border-t bg-panel/95 p-2 backdrop-blur sm:p-3">
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
          <Button variant="outline" className="h-12 flex-col gap-0.5 text-[11px] sm:flex-row sm:text-sm" onClick={() => window.dispatchEvent(new Event("focus-question"))}><MessageSquareQuote /> Ask question</Button>
          <Button variant="outline" className="h-12 flex-col gap-0.5 border-primary/60 text-[11px] text-primary sm:flex-row sm:text-sm" onClick={jane}><Lightbulb /> Intuition ({hints})</Button>
          <Button className="h-12 flex-col gap-0.5 bg-destructive text-[11px] text-destructive-foreground hover:bg-destructive/90 sm:flex-row sm:text-sm" onClick={() => setOverlay("accuse")}><Gavel /> Solve case</Button>
        </div>
      </footer>

      {discovered && <div className="discover-pop fixed left-1/2 top-24 z-[70] w-[min(92vw,360px)] -translate-x-1/2 rounded-md border border-primary bg-panel-raised p-4 shadow-2xl"><Eyebrow>New evidence</Eyebrow><p className="mt-1 flex items-center gap-2 font-display text-xl">{(() => { const C = clueById(discovered).icon; return <C className="size-5 text-primary" />; })()}{clueById(discovered).title}</p><p className="mt-1 text-xs text-muted-foreground"><Rich text={clueById(discovered).detail} /></p></div>}
      {overlay === "intro" && <HowToPlay onClose={() => { save("blackwood-intro", true); setOverlay(null); }} />}
      {overlay === "cases" && <Cases onClose={() => setOverlay(null)} onPremium={() => setOverlay("pass")} />}
      {overlay === "pass" && <SeasonPass onClose={() => setOverlay(null)} />}
      {overlay === "scene" && <CrimeScene found={found} onDiscover={discover} onClose={() => setOverlay(null)} />}
      {overlay === "accuse" && <AccuseModal found={found} onClose={() => setOverlay(null)} onRestart={restart} />}
      {overlay === "shop" && <HintShop onClose={() => setOverlay(null)} onRefill={() => { setHints(3); save("blackwood-hints", 3); setOverlay(null); }} />}
      {intuition && <Intuition text={intuition} onClose={() => setIntuition(null)} />}
    </main>
  );
}

function Timer({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const s = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const f = (n: number) => String(n).padStart(2, "0");
  return <div className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" /><span className="font-mono text-xs font-semibold">{f(Math.floor(s / 3600))}:{f(Math.floor(s / 60) % 60)}:{f(s % 60)}</span></div>;
}

function Info({ label, text }: { label: string; text: string }) { return <div><p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">{label}</p><p className="text-xs leading-5 text-foreground/85"><Rich text={text} /></p></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono font-semibold">{value}</span></div>; }
