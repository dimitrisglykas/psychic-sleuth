import { createFileRoute } from "@tanstack/react-router";
import { Activity, Armchair, BookOpen, ChevronDown, ChevronUp, Clock3, Coffee, FolderOpen, Gavel, Lightbulb, MessageSquareQuote, Search, Target, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccuseModal } from "@/components/game/accuse";
import { CrimeScene } from "@/components/game/crime-scene";
import { Interrogation, type Meta } from "@/components/game/interrogation";
import { Desk } from "@/components/game/desk";
import { CaseLobby } from "@/components/game/lobby";
import { Cases, HintShop, HowToPlay, Intuition, SeasonPass } from "@/components/game/overlays";
import { Eyebrow, Overlay, Rich, StressBar, stressLabel } from "@/components/game/ui";
import { CASES, CaseContext, clueOf, janeQuotes, useCase, type CaseData, type ClueId, type PersonId } from "@/game/case";


export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Psychic Sleuth — Cinematic AI Mystery Game" },
    { name: "description", content: "Search cinematic crime scenes, question AI suspects, read every tell, and solve each Psychic Sleuth case." },
    { property: "og:title", content: "Psychic Sleuth — Cinematic AI Mystery Game" },
    { property: "og:description", content: "Search the scene. Question every alibi. Read every tell. Name the killer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MysteryGame,
});

type OverlayKind = null | "desk" | "intro" | "casefile" | "cases" | "scene" | "accuse" | "shop" | "pass";
const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } };
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

function MysteryGame() {
  const [code, setCode] = useState("001");
  useEffect(() => { const c = localStorage.getItem("psychic-case"); if (c && CASES[c]) setCode(c); }, []);
  const pick = (c: string) => { localStorage.setItem("psychic-case", c); setCode(c); };
  const C = CASES[code]!;
  return <CaseContext.Provider value={C}><Game key={code} C={C} onPickCase={pick} /></CaseContext.Provider>;
}

function Game({ C, onPickCase }: { C: CaseData; onPickCase: (code: string) => void }) {
  const { suspectIds: SUSPECT_IDS, suspects, people, clues, connections, storageKey: K, guide } = C;
  const START_CLUES = C.startClues;
  const clueById = (id: ClueId) => clueOf(C, id);
  const [suspectId, setSuspectId] = useState<PersonId>(guide.suspect);
  const [meta, setMeta] = useState<Partial<Record<PersonId, Meta>>>({});
  const [counts, setCounts] = useState<Partial<Record<PersonId, number>>>({});
  const [found, setFound] = useState<ClueId[]>(START_CLUES);
  const [hints, setHints] = useState(3);
  const [overlay, setOverlay] = useState<OverlayKind>(null);
  const [intuition, setIntuition] = useState<string | null>(null);
  const [injected, setInjected] = useState<{ id: ClueId; n: number } | null>(null);
  const [discovered, setDiscovered] = useState<ClueId | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [calmSince, setCalmSince] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tea, setTea] = useState<{ quote: string; text: string; pair: [ClueId, ClueId] } | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [inspected, setInspected] = useState<ClueId | null>(null);
  const [hasOutcome, setHasOutcome] = useState(false);
  const [sharedProgress, setSharedProgress] = useState(0);

  useEffect(() => {
    setMeta(load(`${K}-meta`, {})); setFound(load(`${K}-found`, START_CLUES)); setHints(load(`${K}-hints`, 3));
    const savedSuspect = load<PersonId>(`${K}-active-person`, guide.suspect);
    if (people[savedSuspect]) setSuspectId(savedSuspect);
    const c: Partial<Record<PersonId, number>> = {};
    for (const id of [...SUSPECT_IDS, "victim" as const]) c[id] = load<{ role: string }[]>(`${K}-chat-${id}`, []).filter((m) => m.role === "user").length;
    setCounts(c);
    const s = load<number | null>(`${K}-started`, null) ?? Date.now(); save(`${K}-started`, s); setStartedAt(s);
    const outcome = load<unknown | null>(`${K}-outcome`, null);
    setHasOutcome(!!outcome);
    if (outcome) setOverlay("accuse");
    else if (!load(`${K}-intro`, false)) setOverlay("intro");
  }, []);

  const suspect = people[suspectId]!;
  const stressOf = (id: PersonId) => meta[id]?.stress ?? people[id]!.stress;
  const questioned = SUSPECT_IDS.filter((id) => (counts[id] ?? 0) > 0);
  const guiding = !(counts[guide.suspect] ?? 0) && suspectId === guide.suspect;

  const updateMeta = (m: Meta) => setMeta((prev) => { const next = { ...prev, [suspectId]: m } as Partial<Record<PersonId, Meta>>; save(`${K}-meta`, next); return next; });
  const askClue = (id: ClueId) => setInjected({ id, n: Date.now() });
  const discover = (id: ClueId) => { setFound((f) => { const next = f.includes(id) ? f : [...f, id]; save(`${K}-found`, next); return next; }); setDiscovered(id); window.setTimeout(() => setDiscovered(null), 2600); };
  const mergeSharedClues = useCallback((shared: string[]) => setFound((current) => { const valid = shared.filter((id): id is ClueId => clues.some((clue) => clue.id === id)); const next = [...new Set([...current, ...valid])]; if (next.length !== current.length) save(`${K}-found`, next); return next.length === current.length ? current : next; }), [K, clues]);
  const switchSuspect = (id: PersonId) => { setSuspectId(id); save(`${K}-active-person`, id); setInjected(null); };
  const jane = () => {
    const m = meta[suspectId];
    if (hints <= 0) { setOverlay("shop"); return; }
    if (!m?.tell) { setIntuition(`Ask ${suspect.short} something first — even Jane needs a reaction to read.`); return; }
    const next = hints - 1; setHints(next); save(`${K}-hints`, next);
    setIntuition(`${m.observation ? `"${m.observation}." ` : ""}${m.tell}`);
  };
  const togglePlay = () => setPlaying(!playing);
  const toggleCalm = () => {
    if (calmSince) { const s2 = (startedAt ?? Date.now()) + (Date.now() - calmSince); setStartedAt(s2); save(`${K}-started`, s2); setCalmSince(null); }
    else setCalmSince(Date.now());
  };
  const sipTea = () => {
    const options = connections.filter((c) => found.includes(c.a) && found.includes(c.b));
    const c = options[Math.floor(Math.random() * options.length)] ?? connections[connections.length - 1]!;
    setTea({ quote: janeQuotes[Math.floor(Math.random() * janeQuotes.length)]!, text: c.text, pair: [c.a, c.b] });
    window.setTimeout(() => setTea(null), 9000);
  };
  const restart = () => { Object.keys(localStorage).filter((k) => k.startsWith(`${K}-`) && k !== `${K}-intro`).forEach((k) => localStorage.removeItem(k)); window.location.reload(); };

  const left = clues.length - found.length;
  const nextStep = hasOutcome ? "Review the case conclusion"
    : !(counts[guide.suspect] ?? 0) ? `Show ${suspects[guide.suspect]!.short} the ${guide.label}`
    : !(counts["victim"] ?? 0) ? `Interview ${C.victim.short}`
    : left > 0 ? `Search the crime scene (${left} clue${left > 1 ? "s" : ""} left)`
    : questioned.length < 3 ? `Question ${SUSPECT_IDS.filter((id) => !questioned.includes(id)).map((id) => suspects[id]!.short).join(" and ")}`
    : "Solve the case";
  const nextHint = !(counts[guide.suspect] ?? 0) ? "Tap the highlighted clue. It will prepare the right question for you."
    : !(counts["victim"] ?? 0) ? "Their last hour may expose a contradiction."
    : left > 0 ? "Inspect the glowing points and collect what the room is hiding."
    : questioned.length < 3 ? "Every suspect has a different story. Hear the missing one."
    : "Name the culprit, their motive, and the two clues that prove it.";
  const localProgress = Math.round(((found.length / clues.length) + (questioned.length / 3) + ((counts["victim"] ?? 0) > 0 ? 1 : 0)) / 3 * 100);
  const progress = Math.max(localProgress, sharedProgress);
  const readyToSolve = left === 0 && questioned.length === SUSPECT_IDS.length && (counts["victim"] ?? 0) > 0;

  const doNext = () => {
    if (hasOutcome) { setOverlay("accuse"); return; }
    if (!(counts[guide.suspect] ?? 0)) { switchSuspect(guide.suspect); askClue(guide.clue); return; }
    if (!(counts["victim"] ?? 0)) { switchSuspect("victim"); return; }
    if (left > 0) { setOverlay("scene"); return; }
    const unasked = SUSPECT_IDS.find((id) => !questioned.includes(id));
    if (unasked) { switchSuspect(unasked); return; }
    setOverlay("accuse");
  };

  const clueButtons = (compact: boolean) => found.map((id) => {
    const c = clueById(id); const glow = (guiding && id === guide.clue) || !!tea?.pair.includes(id);
    return <div key={id} className={`group relative shrink-0 overflow-hidden rounded-sm border bg-panel-raised transition-colors hover:border-primary/60 ${compact ? "w-36" : ""} ${glow ? "guide-ring border-primary" : ""}`}>
      <div className={`relative overflow-hidden bg-muted ${compact ? "h-16" : "h-24"}`}><EvidenceCrop id={id} /><div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2"><p className={`${compact ? "text-[10px]" : "text-xs"} font-semibold`}>{c.title}</p><Button size="icon" variant="secondary" className="size-7 shrink-0" onClick={() => setInspected(id)} aria-label={`Inspect ${c.title}`} title={`Inspect ${c.title}`}><ZoomIn className="size-3.5" /></Button></div></div>
      {!compact && <Button variant="ghost" size="sm" onClick={() => askClue(id)} aria-label={`Ask about ${c.title}`} className="w-full justify-start rounded-none text-[10px] text-primary"><MessageSquareQuote className="size-3.5" /> Use in interview</Button>}
      {compact && <Button variant="ghost" size="sm" onClick={() => askClue(id)} aria-label={`Ask about ${c.title}`} className="h-7 w-full justify-start rounded-none px-2 text-[9px] text-primary"><MessageSquareQuote className="size-3" /> Ask with clue</Button>}
      {guiding && id === guide.clue && <span className="absolute whitespace-nowrap rounded-sm bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Start here</span>}
    </div>;
  });

  const reaction = stressOf(suspectId) >= 75 ? "Tension spike" : meta[suspectId]?.observation || (stressOf(suspectId) >= 50 ? "Guarded posture" : "Controlled");

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      <header className="flex min-h-14 items-center gap-3 border-b bg-panel px-4 lg:px-6">
        <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">Psychic Sleuth · You are the consultant</p><h1 className="truncate font-display text-lg sm:text-xl">Case {C.code}: {C.title}</h1></div>
        <Timer startedAt={startedAt} pausedAt={calmSince} />
        <Button variant="ghost" size="icon" onClick={sipTea} aria-label="Sip tea" title="Sip tea"><Coffee className="text-primary" /></Button>
        <CaseLobby caseCode={C.code} storageKey={K} clues={found} progress={localProgress} onSharedClues={mergeSharedClues} onSharedProgress={setSharedProgress} />
        <Button variant="outline" size="sm" className="border-primary/60 text-primary" onClick={() => setOverlay("casefile")}><BookOpen /> Case</Button>
        <Button variant="ghost" size="sm" onClick={() => setOverlay("desk")}><Armchair /> <span className="hidden sm:inline">My desk</span></Button>
        <Button variant="ghost" size="sm" onClick={() => setOverlay("cases")}><FolderOpen /> <span className="hidden sm:inline">Cases</span></Button>
      </header>

      <div className="border-b bg-accent/40 px-4 py-3 lg:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Target className="size-4" /></span>
           <div className="min-w-0 flex-1"><p className="truncate text-[10px] text-muted-foreground"><span className="font-bold uppercase text-foreground">Mystery:</span> {C.tagline}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-primary">Your next move</p><p className="text-sm font-semibold">{nextStep}</p><p className="hidden text-[11px] text-muted-foreground sm:block">{nextHint}</p></div>
           <Button size="sm" onClick={doNext}>Do it</Button>
        </div>
        <div className="mx-auto mt-2 flex max-w-5xl items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><span className="font-mono text-[10px] text-muted-foreground">Case {progress}%</span></div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* Left: suspect */}
        <aside className="min-h-0 border-b bg-panel lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className={`relative hidden aspect-[4/3] overflow-hidden lg:block ${stressOf(suspectId) >= 75 ? "tension-aura" : ""}`}><img src={suspect.image} alt={suspect.name} className="h-full w-full object-cover object-[center_28%] transition-transform duration-700 hover:scale-[1.02]" width={768} height={1024} /><div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-background/10" /><div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-sm border bg-background/75 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] backdrop-blur"><Activity className={`size-3.5 ${stressOf(suspectId) >= 75 ? "text-destructive" : "text-primary"}`} /> {reaction}</div><div className="absolute inset-x-0 bottom-0 p-4 pt-16"><p className="font-display text-2xl">{suspect.name}</p><p className="text-[10px] uppercase tracking-[.18em] text-primary">{suspect.role}</p></div></div>
          <div className="flex gap-2 overflow-x-auto p-3 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {SUSPECT_IDS.map((id) => <button key={id} onClick={() => switchSuspect(id)} className={`flex min-w-[112px] items-center gap-2 rounded-sm border p-1.5 text-left lg:min-w-0 lg:flex-col lg:items-stretch ${id === suspectId ? "border-primary bg-accent" : "opacity-70 hover:opacity-100"}`}>
              <img src={suspects[id]!.image} alt="" className="size-9 rounded-full object-cover object-top lg:aspect-square lg:size-auto lg:w-full lg:rounded-sm" width={768} height={1024} loading="lazy" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{suspects[id]!.short}</span><StressBar value={stressOf(id)} thin /></span>
            </button>)}
          </div>
          <div className="flex items-center gap-3 border-t px-3 py-2 lg:hidden"><img src={suspect.image} alt="" className="size-10 rounded-full object-cover object-top" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{suspect.name}</p><p className="text-[10px] text-muted-foreground">{suspect.role}</p></div><div className="w-24"><p className="mb-1 text-right text-[10px] text-primary">Stress {stressOf(suspectId)}%</p><StressBar value={stressOf(suspectId)} thin /></div></div>
          <div className="hidden space-y-4 px-4 pb-5 lg:block">
            <div><div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[.16em]"><span>Stress</span><span className="text-primary">{stressOf(suspectId)}% · {stressLabel(stressOf(suspectId))}</span></div><StressBar value={stressOf(suspectId)} /></div>
            <Info label="Who" text={`${suspect.age} · ${suspect.bio}`} /><Info label={suspectId === "victim" ? "Last seen" : "Alibi"} text={suspect.alibi} /><Info label={suspectId === "victim" ? "Unfinished business" : "Possible motive"} text={suspect.motive} />
          </div>
        </aside>

        {/* Center: interrogation */}
        <Interrogation key={suspectId} suspectId={suspectId} stress={stressOf(suspectId)} injected={injected} onMeta={updateMeta}
          onCount={(n) => setCounts((c) => (c[suspectId] === n ? c : { ...c, [suspectId]: n }))}
          header={<div className="flex items-center justify-between border-b px-4 py-2.5"><p className="text-xs"><span className="font-semibold">{suspectId === "victim" ? "Reconstructing" : "Questioning"} {suspect.name}</span> <span className="text-muted-foreground lg:hidden">· stress {stressOf(suspectId)}%</span></p><p className="flex items-center gap-1 text-[10px] text-success"><span className="size-1.5 rounded-full bg-success" /> Recording</p></div>}
          clueStrip={<div className="mx-auto mb-2 flex max-w-2xl gap-2 overflow-x-auto pb-1 pt-4 lg:hidden">{clueButtons(true)}<button onClick={() => setOverlay("scene")} className="flex shrink-0 items-center gap-1.5 rounded-sm border border-dashed border-primary/60 p-2 text-[11px] text-primary"><Search className="size-4" /> Crime scene</button></div>}
        />

        {/* Right: clues & actions */}
        <aside className="hidden min-h-0 flex-col overflow-y-auto border-l bg-panel lg:flex">
          <div className="border-b p-4">
            <Button 
              className={`h-11 w-full ${left > 0 && found.length <= START_CLUES.length ? "animate-guide-pulse border-primary" : ""}`} 
              onClick={() => setOverlay("scene")}
            >
              <Search /> Inspect crime scene
            </Button>
          </div>
          <div className="space-y-3 p-4"><div className="flex items-center justify-between"><Eyebrow>Evidence</Eyebrow><span className="text-[10px] text-muted-foreground">Inspect or question</span></div><div className="grid grid-cols-2 gap-2">{clueButtons(false)}</div>{left > 0 && <p className="rounded-sm border border-dashed p-2.5 text-[11px] text-muted-foreground">{left} clue{left > 1 ? "s" : ""} still hidden in the scene.</p>}</div>
          <div className="mt-auto border-t p-4">
            <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => setShowProgress(!showProgress)}>Investigation details {showProgress ? <ChevronUp /> : <ChevronDown />}</Button>
            {showProgress && <div className="mt-3 space-y-3"><Row label="Clues found" value={`${found.length} / ${clues.length}`} /><Row label="People questioned" value={`${questioned.length + ((counts["victim"] ?? 0) > 0 ? 1 : 0)} / 4`} />
              {[...SUSPECT_IDS, "victim" as const].map((id) => <div key={id}><div className="mb-1 flex justify-between text-[11px]"><span>{people[id]!.short}</span><span className="font-mono text-muted-foreground">{stressOf(id)}%</span></div><StressBar value={stressOf(id)} thin /></div>)}
            </div>}
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 z-30 border-t bg-panel/95 p-2 backdrop-blur sm:p-3">
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
          <Button variant="outline" className="h-12 flex-col gap-0.5 text-[11px] sm:flex-row sm:text-sm" onClick={() => window.dispatchEvent(new Event("focus-question"))}><MessageSquareQuote /> Ask question</Button>
          <Button variant="outline" className="h-12 flex-col gap-0.5 border-primary/60 text-[11px] text-primary sm:flex-row sm:text-sm" onClick={jane}><Lightbulb /> Intuition ({hints})</Button>
          <Button variant={readyToSolve ? "default" : "outline"} className={`h-12 flex-col gap-0.5 text-[11px] sm:flex-row sm:text-sm ${readyToSolve ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border-destructive/50 text-muted-foreground"}`} onClick={() => setOverlay("accuse")}><Gavel /> Solve case</Button>
        </div>
      </footer>

      {discovered && <div className="discover-pop fixed left-1/2 top-24 z-[70] w-[min(92vw,360px)] -translate-x-1/2 rounded-md border border-primary bg-panel-raised p-4 shadow-2xl"><Eyebrow>New evidence</Eyebrow><p className="mt-1 flex items-center gap-2 font-display text-xl">{(() => { const C = clueById(discovered).icon; return <C className="size-5 text-primary" />; })()}{clueById(discovered).title}</p><p className="mt-1 text-xs text-muted-foreground"><Rich text={clueById(discovered).detail} /></p></div>}
      {tea && <div className="discover-pop fixed left-1/2 top-20 z-[70] w-[min(94vw,560px)] -translate-x-1/2 overflow-hidden rounded-md border border-primary bg-panel-raised shadow-2xl"><div className="relative h-28 overflow-hidden"><img src={C.scene.evidenceImage} alt="" className="h-full w-full object-cover opacity-55" width={1600} height={1008} /><div className="absolute inset-0 bg-gradient-to-t from-panel-raised to-transparent" /><div className="absolute inset-0 grid place-items-center"><span className="tea-ripple grid size-16 place-items-center rounded-full border border-primary/60 bg-background/45 backdrop-blur"><Coffee className="size-7 text-primary" /></span></div></div><div className="p-4 pt-2"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Jane sees the connection</p><p className="mt-2 font-display text-[15px] italic leading-6">{tea.quote}</p><p className="mt-2 border-t pt-2 text-xs"><span className="font-semibold text-primary">Overlooked connection: </span><Rich text={tea.text} /></p><p className="mt-1 text-[10px] text-muted-foreground">{clueById(tea.pair[0]).title} + {clueById(tea.pair[1]).title}</p></div></div>}
      {overlay === "desk" && <Desk playing={playing} onTogglePlay={togglePlay} calm={!!calmSince} onToggleCalm={toggleCalm} onOpenCases={() => setOverlay("cases")} onPick={(c) => { setPlaying(false); setOverlay(null); if (c !== C.code) onPickCase(c); }} onClose={() => { setPlaying(false); setOverlay(null); }} />}
      {overlay === "intro" && <HowToPlay onClose={() => { save(`${K}-intro`, true); setOverlay(null); }} />}
      {overlay === "casefile" && <HowToPlay returning onClose={() => setOverlay(null)} />}
      {overlay === "cases" && <Cases onPick={(c) => { setOverlay(null); if (c !== C.code) onPickCase(c); }} onClose={() => setOverlay(null)} onPremium={() => setOverlay("pass")} />}
      {overlay === "pass" && <SeasonPass onClose={() => setOverlay(null)} />}
      {overlay === "scene" && <CrimeScene found={found} onDiscover={discover} onClose={() => setOverlay(null)} />}
      {overlay === "accuse" && <AccuseModal found={found} onClose={() => setOverlay(null)} onRestart={restart} onOutcome={() => setHasOutcome(true)} />}
      {overlay === "shop" && <HintShop onClose={() => setOverlay(null)} onRefill={() => { setHints(3); save(`${K}-hints`, 3); setOverlay(null); }} />}
      {intuition && <Intuition text={intuition} image={suspect.image} name={suspect.short} stress={stressOf(suspectId)} onClose={() => setIntuition(null)} />}
      {inspected && (() => { const c = clueById(inspected); return <Overlay label={`Inspect ${c.title}`} onClose={() => setInspected(null)} className="max-w-3xl overflow-hidden p-0"><div className="relative aspect-[16/9] overflow-hidden bg-muted"><EvidenceCrop id={inspected} large /><div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" /><div className="absolute bottom-4 left-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Forensic evidence · Case {C.code}</p><h2 className="font-display text-3xl">{c.title}</h2></div></div><div className="p-5"><p className="text-sm leading-6 text-muted-foreground"><Rich text={c.detail} /></p><Button className="mt-4 w-full" onClick={() => { askClue(inspected); setInspected(null); }}><MessageSquareQuote /> Question someone with this</Button></div></Overlay>; })()}
    </main>
  );
}

function Timer({ startedAt, pausedAt }: { startedAt: number | null; pausedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const s = startedAt ? Math.max(0, Math.floor(((pausedAt ?? now) - startedAt) / 1000)) : 0;
  const f = (n: number) => String(n).padStart(2, "0");
  return <div className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" /><span className="font-mono text-xs font-semibold">{f(Math.floor(s / 3600))}:{f(Math.floor(s / 60) % 60)}:{f(s % 60)}</span></div>;
}

function Info({ label, text }: { label: string; text: string }) { return <div><p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">{label}</p><p className="text-xs leading-5 text-foreground/85"><Rich text={text} /></p></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono font-semibold">{value}</span></div>; }

function EvidenceCrop({ id, large = false }: { id: ClueId; large?: boolean }) {
  const C = useCase();
  const clue = C?.clues.find((item) => item.id === id);
  if (!C || !clue) return null;
  return <div className={`absolute inset-0 overflow-hidden evidence-slot-${clue.visualSlot}`}><img src={C.scene.evidenceImage} alt="" className={`evidence-sheet max-w-none ${large ? "evidence-sheet-large" : ""}`} width={1600} height={1008} loading="lazy" /></div>;
}
