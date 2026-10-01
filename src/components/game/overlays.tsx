import { Briefcase, Crown, Eye, Gavel, Lightbulb, Lock, MessageSquareQuote, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CASES, lockedCases, useCase } from "@/game/case";
import { Eyebrow, Overlay } from "./ui";

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: Eye, title: "Find clues", text: "Search the scene and tap anything suspicious." },
    { icon: MessageSquareQuote, title: "Ask questions", text: "Tap a clue to prepare a question, then send it to a suspect." },
    { icon: Gavel, title: "Solve it", text: "When the story fits, name the killer and prove it with two clues." },
  ];
  const C = useCase();
  const [briefed, setBriefed] = useState(false);
  if (!briefed) return (
    <Overlay label="Case briefing" onClose={() => setBriefed(true)}>
      <img src={C.scene.image} alt={C.scene.alt} className="-mx-1 mb-4 aspect-[16/7] w-[calc(100%+0.5rem)] rounded-sm object-cover" width={1280} height={720} />
      <Eyebrow>Incoming call · {C.briefing.time}</Eyebrow><h2 className="font-display text-2xl">You're on the case</h2>
      <div className="mt-3 space-y-2 rounded-sm border-l-2 border-primary bg-accent/50 p-3 text-sm leading-6">
        {C.briefing.lines.map((l) => <p key={l}><span className="font-semibold text-primary">Lisbon:</span> "{l}"</p>)}
      </div>
      <p className="mt-3 text-xs italic text-muted-foreground">{C.briefing.aside}</p>
      <Button className="mt-5 h-11 w-full" onClick={() => setBriefed(true)}><Briefcase /> Accept the case</Button>
    </Overlay>
  );
  return (
    <Overlay label="How to play" onClose={onClose}>
      <Eyebrow>Case {C.code} · {C.title}</Eyebrow><h2 className="font-display text-2xl">Three things to do</h2>
      <p className="mt-1 text-sm text-muted-foreground">Follow the highlighted next step. The game will always point you forward.</p>
      <ol className="mt-5 space-y-3">{steps.map((s, i) => <li key={s.title} className="flex gap-3 rounded-sm border bg-panel-raised p-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><s.icon className="size-4" /></span><div><p className="text-sm font-semibold">{i + 1}. {s.title}</p><p className="text-xs text-muted-foreground">{s.text}</p></div></li>)}</ol>
      <Button className="mt-5 h-11 w-full" onClick={onClose}><Play /> Start the investigation</Button>
    </Overlay>
  );
}

export function HintShop({ onClose, onRefill }: { onClose: () => void; onRefill: () => void }) {
  const packs = [{ n: 3, price: "€0.99" }, { n: 10, price: "€2.49" }, { n: 25, price: "€4.99" }];
  return (
    <Overlay label="Get more hints" onClose={onClose}>
      <Eyebrow>Out of intuition</Eyebrow><h2 className="font-display text-2xl">Refill Jane's Intuition</h2>
      <div className="mt-4 grid grid-cols-3 gap-2">{packs.map((p) => <div key={p.n} className="rounded-sm border bg-panel-raised p-3 text-center"><Lightbulb className="mx-auto size-5 text-primary" /><p className="mt-1 font-display text-xl">{p.n}</p><p className="text-[10px] text-muted-foreground">hints</p><Button size="sm" variant="outline" className="mt-2 w-full" disabled>{p.price}</Button></div>)}</div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Payments are a preview and not live yet.</p>
      <Button className="mt-3 w-full" onClick={onRefill}>Get 3 free hints</Button>
    </Overlay>
  );
}

export function SeasonPass({ onClose }: { onClose: () => void }) {
  const plans = [{ name: "Monthly", price: "€4.99", per: "/month", note: "Cancel anytime" }, { name: "Season Pass", price: "€19.99", per: "/season", note: "All 6 cases + unlimited hints", best: true }];
  return (
    <Overlay label="Season Pass" onClose={onClose}>
      <Eyebrow>Premium</Eyebrow><h2 className="font-display text-2xl">Unlock every case</h2>
      <p className="mt-1 text-sm text-muted-foreground">New mysteries every month, unlimited Jane's Intuition, and bonus crime scenes.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{plans.map((p) => <div key={p.name} className={`rounded-sm border p-4 ${p.best ? "border-primary bg-accent" : "bg-panel-raised"}`}>{p.best && <p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-primary">Best value</p>}<p className="text-sm font-semibold">{p.name}</p><p className="mt-1"><span className="font-display text-3xl">{p.price}</span><span className="text-xs text-muted-foreground">{p.per}</span></p><p className="mt-1 text-xs text-muted-foreground">{p.note}</p></div>)}</div>
      <Button className="mt-4 h-11 w-full" disabled><Crown /> Checkout coming soon</Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">Secure payments by Stripe · preview only, no charge.</p>
    </Overlay>
  );
}

export function Cases({ onClose, onPick, onPremium }: { onClose: () => void; onPick: (code: string) => void; onPremium: () => void }) {
  const C = useCase();
  return (
    <Overlay label="Cases" onClose={onClose} className="max-w-2xl">
      <Eyebrow>Your cases</Eyebrow><h2 className="mb-4 font-display text-2xl">Case files</h2>
      <div className="space-y-2">
        {Object.values(CASES).map((k) => { const on = k.code === C.code; return <button key={k.code} onClick={() => onPick(k.code)} className={`w-full rounded-sm border p-4 text-left ${on ? "border-primary bg-accent" : "bg-panel-raised hover:border-primary/60"}`}><div className="flex items-center justify-between"><p className="font-mono text-[10px] text-primary">CASE {k.code} · {on ? "ACTIVE" : "OPEN"} · FREE</p><span className="text-[10px] font-bold uppercase text-success">{on ? "Continue" : "Play"}</span></div><p className="mt-1 font-display text-xl">{k.title}</p><p className="text-xs text-muted-foreground">{k.tagline}</p></button>; })}
        {lockedCases.map((c) => <div key={c.code} className="flex items-center gap-3 rounded-sm border bg-panel-raised p-4 opacity-90"><Lock className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-mono text-[10px] text-muted-foreground">CASE {c.code} · LOCKED</p><p className="font-display text-lg">{c.title}</p><p className="text-xs text-muted-foreground">{c.teaser}</p></div><Button size="sm" onClick={onPremium}><Crown /> Unlock</Button></div>)}
      </div>
    </Overlay>
  );
}

export function Intuition({ text, image, name, stress, onClose }: { text: string; image: string; name: string; stress: number; onClose: () => void }) {
  return (
    <Overlay label="Jane's intuition" onClose={onClose} className="max-w-2xl overflow-hidden border-primary/60 p-0">
      <div className="grid sm:grid-cols-[.85fr_1.15fr]">
        <div className="intuition-portrait relative min-h-72 overflow-hidden border-b sm:border-b-0 sm:border-r"><img src={image} alt={name} className="absolute inset-0 h-full w-full object-cover object-top" width={768} height={1024} /><div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-primary/10" /><span className="intuition-focus absolute left-[56%] top-[31%] size-12 rounded-full border border-primary" /><span className="absolute left-[calc(56%+3rem)] top-[31%] whitespace-nowrap rounded-sm border bg-background/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-primary">Eyes shift</span><span className="absolute bottom-4 left-4 rounded-sm border bg-background/80 px-2 py-1 text-[10px]">Stress {stress}%</span></div>
        <div className="p-5 sm:p-7"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><Lightbulb className="size-4" /> Jane's intuition</p><h2 className="mt-2 font-display text-2xl">Watch {name}, not the words.</h2><p className="mt-4 font-display text-lg italic leading-7">{text}</p><p className="mt-5 border-t pt-3 text-[10px] uppercase tracking-[.16em] text-muted-foreground">Non-verbal read · private observation</p></div>
      </div>
    </Overlay>
  );
}
