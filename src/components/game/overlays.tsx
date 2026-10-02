import { ArrowLeft, BookOpen, Briefcase, Crown, Eye, FileSearch, Gavel, Lightbulb, Lock, MessageSquareQuote, Play, Search, ShieldAlert, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CASES, JANE_PROFILE, WORLD_LORE, lockedCases, useCase, type CaseData } from "@/game/case";
import { Eyebrow, Overlay, Rich } from "./ui";

export function HowToPlay({ onClose, returning = false }: { onClose: () => void; returning?: boolean }) {
  const steps = [
    { icon: Eye, title: "Search", text: "Scour the scene for physical evidence." },
    { icon: MessageSquareQuote, title: "Interrogate", text: "Show clues to suspects to trigger a "tell"." },
    { icon: Gavel, title: "Deduce", text: "Connect the motive and evidence to close the case." },
  ];
  const C = useCase();
  return (
    <Overlay label="Mission Briefing" onClose={onClose} className="max-w-3xl overflow-hidden p-0">
      <div className="relative">
        <img src={C.scene.image} alt={C.scene.alt} className="aspect-[16/7] w-full object-cover" width={1280} height={720} />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5"><Eyebrow>Mission Briefing · Case {C.code}</Eyebrow><h2 className="font-display text-2xl sm:text-3xl">{C.title}</h2><p className="text-sm text-foreground/80">{C.tagline}</p></div>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-sm border bg-panel-raised p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary"><Search className="size-3.5" /> What happened</p><p className="mt-1 text-xs leading-5">{C.tagline}</p></div>
          <div className="rounded-sm border bg-panel-raised p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary"><Briefcase className="size-3.5" /> Your role</p><p className="mt-1 text-xs leading-5">You are Jane's partner. Read people, test alibis, follow evidence.</p></div>
          <div className="rounded-sm border bg-panel-raised p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary"><Target className="size-3.5" /> Your goal</p><p className="mt-1 text-xs leading-5">Name the culprit, motive, and two clues that prove it.</p></div>
        </div>
        <div className="space-y-2 rounded-sm border-l-2 border-primary bg-accent/50 p-3 text-sm leading-6">
          {C.briefing.lines.map((l) => <p key={l}><span className="font-semibold text-primary">Lisbon:</span> "{l}"</p>)}
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">The victim</p>
          <div className="flex gap-3 rounded-sm border bg-panel-raised p-3"><img src={C.victim.image} alt={C.victim.name} className="size-16 shrink-0 rounded-sm object-cover object-top" width={128} height={128} /><div className="text-xs leading-5"><p className="font-display text-lg">{C.victim.name}</p><p><Rich text={C.victim.alibi} /></p></div></div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">The suspects</p>
          <div className="grid gap-2 sm:grid-cols-3">{C.suspectIds.map((id) => { const p = C.suspects[id]; if (!p) return null; return <div key={id} className="flex gap-3 rounded-sm border bg-panel-raised p-2.5 sm:block"><img src={p.image} alt={p.name} className="size-14 shrink-0 rounded-sm object-cover object-top sm:mb-2 sm:aspect-[4/3] sm:h-auto sm:w-full" width={256} height={192} /><div className="text-xs leading-5"><p className="font-semibold">{p.name}</p><p className="text-[10px] uppercase tracking-[.12em] text-primary">{p.role}</p><p className="mt-1 text-muted-foreground"><Rich text={p.alibi} /></p></div></div>; })}</div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Three moves. That’s the whole game.</p>
          <ol className="grid gap-2 sm:grid-cols-3">{steps.map((s, i) => <li key={s.title} className="flex gap-2.5 rounded-sm border bg-panel-raised p-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><s.icon className="size-4" /></span><div><p className="text-sm font-semibold">{i + 1}. {s.title}</p><p className="text-xs text-muted-foreground">{s.text}</p></div></li>)}</ol>
        </div>
        <Button className="h-12 w-full text-base" onClick={onClose}>{returning ? <><ArrowLeft /> Back to the investigation</> : <><Play /> Start the investigation</>}</Button>
        {returning && <p className="text-center text-[11px] text-muted-foreground">Open this case file anytime from the top bar.</p>}
      </div>
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
  const [researching, setResearching] = useState<CaseData | null>(null);
  if (researching) return <CharacterGallery caseData={researching} onBack={() => setResearching(null)} onPlay={() => onPick(researching.code)} />;
  return (
    <Overlay label="Cases" onClose={onClose} className="max-w-2xl">
      <Eyebrow>Your cases</Eyebrow><h2 className="mb-4 font-display text-2xl">Case files</h2>
      <div className="space-y-2">
        {Object.values(CASES).map((k) => { const on = k.code === C.code; return <article key={k.code} className={`overflow-hidden rounded-sm border ${on ? "border-primary bg-accent" : "bg-panel-raised"}`}><div className="grid grid-cols-[92px_1fr] sm:grid-cols-[150px_1fr]"><img src={k.scene.image} alt="" className="h-full min-h-32 w-full object-cover" width={1280} height={720} /><div className="min-w-0 p-4"><p className="font-mono text-[10px] text-primary">CASE {k.code} · {on ? "ACTIVE" : "OPEN"} · FREE</p><p className="mt-1 font-display text-xl">{k.title}</p><p className="mt-1 text-xs text-muted-foreground">{k.tagline}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setResearching(k)}><FileSearch /> Research people</Button><Button size="sm" onClick={() => onPick(k.code)}><Play /> {on ? "Continue" : "Start case"}</Button></div></div></div></article>; })}
        {lockedCases.map((c) => <div key={c.code} className="flex items-center gap-3 rounded-sm border bg-panel-raised p-4 opacity-90"><Lock className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-mono text-[10px] text-muted-foreground">CASE {c.code} · LOCKED</p><p className="font-display text-lg">{c.title}</p><p className="text-xs text-muted-foreground">{c.teaser}</p></div><Button size="sm" onClick={onPremium}><Crown /> Unlock</Button></div>)}
      </div>
    </Overlay>
  );
}

function CharacterGallery({ caseData: C, onBack, onPlay }: { caseData: CaseData; onBack: () => void; onPlay: () => void }) {
  const [section, setSection] = useState<"people" | "jane" | "world">("people");
  return (
    <Overlay label={`${C.title} character gallery`} onClose={onBack} className="max-w-5xl overflow-hidden p-0">
      <div className="relative min-h-40 overflow-hidden border-b sm:min-h-52">
        <img src={C.scene.image} alt={C.scene.alt} className="absolute inset-0 h-full w-full object-cover" width={1280} height={720} />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7"><Eyebrow>Case {C.code} · Before you investigate</Eyebrow><h2 className="font-display text-3xl sm:text-4xl">People of interest</h2><p className="mt-1 max-w-xl text-sm text-foreground/75">Study their public histories. Everyone has something to hide; only the evidence tells you what matters.</p></div>
      </div>
      <div className="grid grid-cols-3 border-b bg-panel p-2"><Button size="sm" variant={section === "people" ? "secondary" : "ghost"} onClick={() => setSection("people")}><FileSearch /> People</Button><Button size="sm" variant={section === "jane" ? "secondary" : "ghost"} onClick={() => setSection("jane")}><Sparkles /> Jane</Button><Button size="sm" variant={section === "world" ? "secondary" : "ghost"} onClick={() => setSection("world")}><BookOpen /> World</Button></div>
      {section === "people" && <div className="grid gap-px bg-border sm:grid-cols-3">
        {C.suspectIds.map((id) => { const person = C.suspects[id]; if (!person) return null; return <article key={id} className="bg-panel">
          <div className="relative aspect-[5/4] overflow-hidden"><img src={person.image} alt={`${person.name}, ${person.role}`} className="h-full w-full object-cover object-[center_24%] transition-transform duration-700 hover:scale-[1.03]" width={768} height={1024} /><div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4"><p className="font-display text-2xl">{person.name}</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-primary">{person.role} · age {person.age}</p></div></div>
          <div className="space-y-3 p-4 text-xs leading-5"><div><p className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">Background</p><p><Rich text={person.bio} /></p></div><div><p className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">Statement</p><p><Rich text={person.alibi} /></p></div><div className="rounded-sm border border-primary/35 bg-accent/50 p-3"><p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-primary"><ShieldAlert className="size-3" /> Known secret</p><p><Rich text={person.knownSecret ?? person.motive} /></p></div></div>
        </article>; })}
      </div>}
      {section === "jane" && <div className="grid bg-panel lg:grid-cols-[.9fr_1.1fr]"><div className="relative min-h-80 overflow-hidden border-b lg:border-b-0 lg:border-r"><img src={JANE_PROFILE.image} alt="Patrick Jane, independent consultant" className="absolute inset-0 h-full w-full object-cover object-top" width={1024} height={1024} /><div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="font-display text-3xl">{JANE_PROFILE.name}</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{JANE_PROFILE.role}</p></div></div><div className="space-y-5 p-5 sm:p-7"><div><Eyebrow>The consultant</Eyebrow><p className="mt-2 text-sm leading-6 text-foreground/85">{JANE_PROFILE.backstory}</p></div><div className="grid gap-3 sm:grid-cols-2"><InfoBlock title="Lisbon" text={JANE_PROFILE.lisbon} /><InfoBlock title="Habits" text={JANE_PROFILE.habits} /></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-primary">How intuition works</p><div className="grid gap-2 sm:grid-cols-2">{JANE_PROFILE.method.map((step, index) => <div key={step.title} className="rounded-sm border bg-panel-raised p-3"><p className="font-display text-lg"><span className="mr-2 text-primary">0{index + 1}</span>{step.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{step.text}</p></div>)}</div><p className="mt-3 text-xs italic text-muted-foreground">Not psychic. Just attentive — and occasionally theatrical.</p></div></div></div>}
      {section === "world" && <div className="bg-panel p-5 sm:p-7"><Eyebrow>Case archive</Eyebrow><h3 className="font-display text-3xl">{C.lore.title}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{C.lore.summary}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{C.lore.entries.map((entry) => <InfoBlock key={entry.title} title={entry.title} text={entry.text} />)}{WORLD_LORE.map((entry) => <InfoBlock key={entry.title} title={entry.title} text={entry.text} />)}</div></div>}
      <div className="flex items-center justify-between gap-3 border-t bg-panel-raised p-4"><Button variant="ghost" onClick={onBack}><ArrowLeft /> Case files</Button><Button onClick={onPlay}><Briefcase /> Investigate this case</Button></div>
    </Overlay>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return <article className="rounded-sm border bg-panel-raised p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">{title}</p><p className="mt-1.5 text-xs leading-5 text-foreground/80">{text}</p></article>;
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
