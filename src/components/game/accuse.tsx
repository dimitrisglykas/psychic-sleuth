import { useEffect, useState } from "react";
import { Gavel, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { checkAccusation } from "@/lib/accuse.functions";
import { clueOf, useCase, type ClueId, type MotiveId, type SuspectId } from "@/game/case";
import { Eyebrow, Overlay, Rich } from "./ui";

const rating = (s: number) => s === 100 ? "Master Mentalist" : s >= 75 ? "Sharp Consultant" : s >= 50 ? "Promising Rookie" : "Back to the Couch";

export function AccuseModal({ found, onClose, onRestart, onOutcome }: { found: ClueId[]; onClose: () => void; onRestart: () => void; onOutcome?: () => void }) {
  const C = useCase(); const { motives, suspectIds: SUSPECT_IDS, suspects } = C; const clueById = (id: ClueId) => clueOf(C, id);
  const [culprit, setCulprit] = useState<SuspectId | null>(null);
  const [motive, setMotive] = useState<MotiveId | null>(null);
  const [picked, setPicked] = useState<ClueId[]>([]);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof checkAccusation>> | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const check = useServerFn(checkAccusation);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${C.storageKey}-outcome`);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { culprit: SuspectId; motive: MotiveId; picked: ClueId[]; result: Awaited<ReturnType<typeof checkAccusation>> };
      setCulprit(parsed.culprit); setMotive(parsed.motive); setPicked(parsed.picked); setResult(parsed.result); setDone(true);
    } catch { localStorage.removeItem(`${C.storageKey}-outcome`); }
  }, [C.storageKey]);
  const submit = async () => {
    if (!culprit || !motive) return;
    setBusy(true); setErr("");
    try { const checked = await check({ data: { caseCode: C.code, culprit, motive, clues: picked } }); setResult(checked); setDone(true); localStorage.setItem(`${C.storageKey}-outcome`, JSON.stringify({ culprit, motive, picked, result: checked })); window.dispatchEvent(new CustomEvent("case-outcome", { detail: { won: checked.won, score: checked.score, rating: rating(checked.score) } })); onOutcome?.(); }
    catch { setErr("Jane couldn't reach the case file. Try again in a moment."); }
    finally { setBusy(false); }
  };
  const toggle = (id: ClueId) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length < 2 ? [...p, id] : p);
  const ready = culprit && motive && picked.length === 2;

  if (done && culprit && motive && result) {
    const s = result.score; const won = result.won;
    return (
      <Overlay label="Case outcome" onClose={onClose} className="max-w-xl">
        <div className="text-center"><div className={`mx-auto mb-3 grid size-14 place-items-center rounded-full ${won ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}><Trophy className="size-6" /></div>
          <Eyebrow>{won ? "Case closed" : "Case unsolved"}</Eyebrow><h2 className="font-display text-3xl">{rating(s)}</h2><p className="mt-1 font-mono text-sm text-muted-foreground">Score {s} / 100</p></div>
        <div className="mt-5 space-y-3 border-l-2 border-primary bg-accent/50 p-4 font-display text-[15px] leading-6">
          <p className="text-[10px] font-sans font-bold uppercase tracking-[.2em] text-primary">Jane explains</p>
          <p><Rich text={won ? result.win : C.ending.lose(suspects[culprit]!.short)} /></p>
          {result.lines.map((l) => <p key={l}><Rich text={l} /></p>)}
          <p className="text-sm text-muted-foreground">Your motive: {motives.find((m) => m.id === motive)?.label} {result.motiveOk ? "✓" : "✗"} · Your clues: {picked.map((c, i) => `${clueById(c).title} ${result.clueOk[i] ? "✓" : "✗"}`).join(", ")}</p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => setDone(false)}>Review my choices</Button><Button onClick={onRestart}><RotateCcw /> Play again</Button></div>
      </Overlay>
    );
  }

  return (
    <Overlay label="Solve the case" onClose={onClose} className="max-w-2xl">
      <Eyebrow>Solve the case</Eyebrow><h2 className="mb-4 font-display text-2xl">Who did it, and why?</h2>
      <Step n={1} title="The culprit" />
      <div className="grid grid-cols-3 gap-2">{SUSPECT_IDS.map((id) => <button key={id} onClick={() => setCulprit(id)} className={`rounded-sm border p-1.5 text-left transition-colors ${culprit === id ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/50"}`}><img src={suspects[id]!.image} alt="" className="mb-1.5 aspect-[4/3] w-full object-cover object-top" width={768} height={1024} loading="lazy" /><p className="text-xs font-semibold">{suspects[id]!.name}</p><p className="text-[10px] text-muted-foreground">{suspects[id]!.role}</p></button>)}</div>
      <Step n={2} title="The motive" />
      <div className="grid gap-2 sm:grid-cols-2">{motives.map((m) => <button key={m.id} onClick={() => setMotive(m.id)} className={`rounded-sm border px-3 py-2.5 text-left text-sm ${motive === m.id ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/50"}`}>{m.label}</button>)}</div>
      <Step n={3} title={`Two key clues (${picked.length}/2)`} />
      <div className="grid gap-2 sm:grid-cols-2">{found.map((id) => { const c = clueById(id); const on = picked.includes(id); return <button key={id} onClick={() => toggle(id)} className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-left text-xs ${on ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/50"}`}><c.icon className="size-4 shrink-0 text-primary" />{c.title}</button>; })}</div>
      {found.length < C.clues.length && <p className="mt-2 text-[11px] text-muted-foreground">Tip: there are more clues hidden at the crime scene.</p>}
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      <Button disabled={!ready || busy} onClick={submit} className="mt-5 h-11 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"><Gavel /> {busy ? "Checking the file…" : "Make the accusation"}</Button>
    </Overlay>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return <p className="mb-2 mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em]"><span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{n}</span>{title}</p>;
}
