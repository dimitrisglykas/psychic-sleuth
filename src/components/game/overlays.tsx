import { Crown, Eye, Gavel, Lightbulb, Lock, MessageSquareQuote, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lockedCases } from "@/game/case";
import { Eyebrow, Overlay } from "./ui";

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: Eye, title: "Read the scene", text: "Check the clues and search the crime scene for hidden evidence." },
    { icon: MessageSquareQuote, title: "Question suspects", text: "Ask questions and show clues. Watch their stress — lies crack under pressure." },
    { icon: Gavel, title: "Accuse the killer", text: "Name the culprit, the motive and two clues that prove it." },
  ];
  const [briefed, setBriefed] = useState(false);
  if (!briefed) return (
    <Overlay label="Case briefing" onClose={() => setBriefed(true)}>
      <img src={sceneImage} alt="Alistair Blackwood's study" className="-mx-1 mb-4 aspect-[16/7] w-[calc(100%+0.5rem)] rounded-sm object-cover" width={1280} height={720} />
      <Eyebrow>Incoming call · 11:42 PM</Eyebrow><h2 className="font-display text-2xl">You're on the case</h2>
      <div className="mt-3 space-y-2 rounded-sm border-l-2 border-primary bg-accent/50 p-3 text-sm leading-6">
        <p><span className="font-semibold text-primary">Lisbon:</span> "Alistair Blackwood is dead in his study at Blackwood Manor. Local police are calling it a robbery gone wrong. I'm not buying it."</p>
        <p><span className="font-semibold text-primary">Lisbon:</span> "Three people were in that house tonight. The case is yours — find me who did it, and why. And please, no stunts."</p>
      </div>
      <p className="mt-3 text-xs italic text-muted-foreground">Jane sets down his tea. "No stunts. Of course."</p>
      <Button className="mt-5 h-11 w-full" onClick={() => setBriefed(true)}><Briefcase /> Accept the case</Button>
    </Overlay>
  );
  return (
    <Overlay label="How to play" onClose={onClose}>
      <Eyebrow>Case 001 · Blackwood Manor</Eyebrow><h2 className="font-display text-2xl">How to play</h2>
      <p className="mt-1 text-sm text-muted-foreground">Three suspects had reasons to lie — and the victim's last hour still has something to say.</p>
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

export function Cases({ onClose, onPremium }: { onClose: () => void; onPremium: () => void }) {
  return (
    <Overlay label="Cases" onClose={onClose} className="max-w-2xl">
      <Eyebrow>Your cases</Eyebrow><h2 className="mb-4 font-display text-2xl">Case files</h2>
      <div className="space-y-2">
        <button onClick={onClose} className="w-full rounded-sm border border-primary bg-accent p-4 text-left"><div className="flex items-center justify-between"><p className="font-mono text-[10px] text-primary">CASE 001 · ACTIVE · FREE</p><span className="text-[10px] font-bold uppercase text-success">Continue</span></div><p className="mt-1 font-display text-xl">The Enigma at Blackwood Manor</p><p className="text-xs text-muted-foreground">A wealthy businessman, a locked study, three liars.</p></button>
        {lockedCases.map((c) => <div key={c.code} className="flex items-center gap-3 rounded-sm border bg-panel-raised p-4 opacity-90"><Lock className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-mono text-[10px] text-muted-foreground">CASE {c.code} · LOCKED</p><p className="font-display text-lg">{c.title}</p><p className="text-xs text-muted-foreground">{c.teaser}</p></div><Button size="sm" onClick={onPremium}><Crown /> Unlock</Button></div>)}
      </div>
    </Overlay>
  );
}

export function Intuition({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <Overlay label="Jane's intuition" onClose={onClose} className="border-primary/60">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><Lightbulb className="size-4" /> Jane's intuition</p>
      <p className="mt-3 font-display text-lg italic leading-7">{text}</p>
    </Overlay>
  );
}
