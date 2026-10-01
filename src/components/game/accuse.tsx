import { useState } from "react";
import { Gavel, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clueById, motives, solution, SUSPECT_IDS, suspects, type ClueId, type MotiveId, type SuspectId } from "@/game/case";
import { Eyebrow, Overlay, Rich } from "./ui";

function score(culprit: SuspectId, motive: MotiveId, picked: ClueId[]) {
  let s = culprit === solution.culprit ? 50 : 0;
  if (motive === solution.motive) s += 25;
  s += picked.filter((c) => solution.clues.includes(c)).length * 12.5;
  return Math.round(s);
}
const rating = (s: number) => s === 100 ? "Master Mentalist" : s >= 75 ? "Sharp Consultant" : s >= 50 ? "Promising Rookie" : "Back to the Couch";

export function AccuseModal({ found, onClose, onRestart }: { found: ClueId[]; onClose: () => void; onRestart: () => void }) {
  const [culprit, setCulprit] = useState<SuspectId | null>(null);
  const [motive, setMotive] = useState<MotiveId | null>(null);
  const [picked, setPicked] = useState<ClueId[]>([]);
  const [done, setDone] = useState(false);
  const toggle = (id: ClueId) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length < 2 ? [...p, id] : p);
  const ready = culprit && motive && picked.length === 2;

  if (done && culprit && motive) {
    const s = score(culprit, motive, picked); const won = culprit === solution.culprit;
    return (
      <Overlay label="Case outcome" onClose={onClose} className="max-w-xl">
        <div className="text-center"><div className={`mx-auto mb-3 grid size-14 place-items-center rounded-full ${won ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}><Trophy className="size-6" /></div>
          <Eyebrow>{won ? "Case closed" : "Case unsolved"}</Eyebrow><h2 className="font-display text-3xl">{rating(s)}</h2><p className="mt-1 font-mono text-sm text-muted-foreground">Score {s} / 100</p></div>
        <div className="mt-5 space-y-3 border-l-2 border-primary bg-accent/50 p-4 font-display text-[15px] leading-6">
          <p className="text-[10px] font-sans font-bold uppercase tracking-[.2em] text-primary">Jane explains</p>
          {won ? <p>"Lovely. You saw past the polished silver. Arthur wasn't hiding a crime against the family — he committed one <em>for</em> it."</p> : <p>"Ah. You chased the loudest secret in the room. {suspects[culprit].short} is guilty of plenty — just not murder."</p>}
          <p><Rich text="Alistair planned to publish **blue letters** exposing the family's old fraud. Arthur, loyal for 31 years, couldn't allow it. He struck after serving tea — his **fingerprint on the tray** proves he was in the study after 9:45." /></p>
          <p><Rich text="Then he staged the time: smashed the watch at **9:40** to point at Evelyn, **moved the clock** to 10:17, and — out of pure habit — **swept the glass into a neat pile**. Nobody tidies a murder scene except a butler." /></p>
          <p className="text-sm text-muted-foreground">Your motive: {motives.find((m) => m.id === motive)?.label} {motive === solution.motive ? "✓" : "✗"} · Your clues: {picked.map((c) => `${clueById(c).title} ${solution.clues.includes(c) ? "✓" : "✗"}`).join(", ")}</p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => setDone(false)}>Review my choices</Button><Button onClick={onRestart}><RotateCcw /> Play again</Button></div>
      </Overlay>
    );
  }

  return (
    <Overlay label="Solve the case" onClose={onClose} className="max-w-2xl">
      <Eyebrow>Solve the case</Eyebrow><h2 className="mb-4 font-display text-2xl">Who did it, and why?</h2>
      <Step n={1} title="The culprit" />
      <div className="grid grid-cols-3 gap-2">{SUSPECT_IDS.map((id) => <button key={id} onClick={() => setCulprit(id)} className={`rounded-sm border p-1.5 text-left transition-colors ${culprit === id ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/50"}`}><img src={suspects[id].image} alt="" className="mb-1.5 aspect-[4/3] w-full object-cover object-top" width={768} height={1024} loading="lazy" /><p className="text-xs font-semibold">{suspects[id].name}</p><p className="text-[10px] text-muted-foreground">{suspects[id].role}</p></button>)}</div>
      <Step n={2} title="The motive" />
      <div className="grid gap-2 sm:grid-cols-2">{motives.map((m) => <button key={m.id} onClick={() => setMotive(m.id)} className={`rounded-sm border px-3 py-2.5 text-left text-sm ${motive === m.id ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/50"}`}>{m.label}</button>)}</div>
      <Step n={3} title={`Two key clues (${picked.length}/2)`} />
      <div className="grid gap-2 sm:grid-cols-2">{found.map((id) => { const c = clueById(id); const on = picked.includes(id); return <button key={id} onClick={() => toggle(id)} className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-left text-xs ${on ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/50"}`}><c.icon className="size-4 shrink-0 text-primary" />{c.title}</button>; })}</div>
      {found.length < 7 && <p className="mt-2 text-[11px] text-muted-foreground">Tip: there are more clues hidden at the crime scene.</p>}
      <Button disabled={!ready} onClick={() => setDone(true)} className="mt-5 h-11 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"><Gavel /> Make the accusation</Button>
    </Overlay>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return <p className="mb-2 mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em]"><span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{n}</span>{title}</p>;
}
