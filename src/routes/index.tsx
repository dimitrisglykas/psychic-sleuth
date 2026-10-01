import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Archive, Brain, BriefcaseBusiness, ChevronRight, Clock3, Fingerprint,
  FolderKanban, Gavel, Lightbulb, ListFilter, Menu, MessageSquareQuote,
  Mic2, Paperclip, Search, ShieldCheck, UserRoundSearch, UsersRound, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import julianImage from "@/assets/julian-voss.jpg";
import evelynImage from "@/assets/evelyn-blackwood.jpg";
import arthurImage from "@/assets/arthur-bell.jpg";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "The Enigma at Blackwood Manor — Blackwood Casefiles" },
    { name: "description", content: "Interrogate three suspects and solve the mystery at Blackwood Manor." },
    { property: "og:title", content: "The Enigma at Blackwood Manor" },
    { property: "og:description", content: "Question every alibi. Connect every clue. Name the killer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MysteryGame,
});

type SuspectId = "partner" | "spouse" | "butler";
const suspects = {
  partner: { name: "Julian Voss", role: "The Business Partner", age: 48, image: julianImage, stress: 64, bio: "Co-founded Blackwood & Voss. Charming in public, exacting behind closed doors.", alibi: "Claims he left the manor at 9:15 PM after a heated accounts meeting.", relation: "Business partner of 18 years", opener: "You wished to speak with me, detective? I’ve already given your constable my statement." },
  spouse: { name: "Evelyn Blackwood", role: "The Ex-Spouse", age: 42, image: evelynImage, stress: 38, bio: "A poised art patron whose divorce from Alistair became society-page ammunition.", alibi: "Says she was alone in the east drawing room from 9:40 PM until the alarm.", relation: "Divorced two years ago", opener: "If this is about Alistair, ask plainly. I have no appetite for theatrics tonight." },
  butler: { name: "Arthur Bell", role: "The Butler", age: 63, image: arthurImage, stress: 27, bio: "Served the Blackwood family for thirty-one years. Knows every lock and passage.", alibi: "States he was inventorying the wine cellar between 9:45 and 10:20 PM.", relation: "Family servant and confidant", opener: "I am at your service. The household deserves clarity, however unpleasant it may be." },
} as const;

const evidence = [
  { id: "watch", title: "The Broken Watch", detail: "Stopped at 9:40 PM", prompt: "Your watch stopped at 9:40 PM. Explain why that time matters." },
  { id: "invoice", title: "Altered Invoice", detail: "Voss ledger · £80,000", prompt: "I found the altered £80,000 invoice in the Voss ledger. What were you hiding?" },
  { id: "ash", title: "Fireplace Ash", detail: "Traces of blue stationery", prompt: "The fireplace ash contains blue stationery. What was burned in the study?" },
  { id: "print", title: "Partial Fingerprint", detail: "On the silver tea tray", prompt: "We recovered a partial fingerprint from the silver tea tray. How did it get there?" },
];

const nav = [
  { icon: FolderKanban, label: "Cases" }, { icon: MessageSquareQuote, label: "Active Case", active: true },
  { icon: Archive, label: "Evidence Board" }, { icon: UsersRound, label: "Suspect List" }, { icon: UserRoundSearch, label: "Profile" },
];

function textOf(message: UIMessage) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}

function MysteryGame() {
  const [suspectId, setSuspectId] = useState<SuspectId>("partner");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [accusing, setAccusing] = useState(false);
  const suspect = suspects[suspectId];
  return (
    <main className="min-h-dvh bg-background text-foreground lg:grid lg:h-dvh lg:grid-cols-[76px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[76px] flex-col border-r bg-panel lg:flex">
        <div className="flex h-20 items-center justify-center border-b"><div className="grid size-10 place-items-center border border-primary/45 bg-accent text-primary"><Fingerprint className="size-5" /></div></div>
        <nav className="flex flex-1 flex-col items-center gap-3 py-5">{nav.map(({icon: Icon,label,active}) => <button key={label} title={label} aria-label={label} className={`grid size-11 place-items-center border-l-2 transition-colors ${active ? "border-primary bg-accent text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-[18px]" /></button>)}</nav>
        <div className="mb-5 flex justify-center"><div className="grid size-9 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">J</div></div>
      </aside>

      <section className="flex min-h-dvh min-w-0 flex-col lg:h-dvh">
        <header className="flex min-h-16 items-center gap-3 border-b bg-panel px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu /></Button>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">Case 0017 · Active investigation</p><h1 className="truncate font-display text-lg text-foreground sm:text-xl">The Enigma at Blackwood Manor</h1></div>
          <div className="hidden items-center gap-5 md:flex"><Stat icon={Clock3} label="Case Time" value="01:42:18" /><Stat icon={Lightbulb} label="Jane Intuition" value="3 hints" /></div>
          <Button className="h-10 bg-destructive px-3 text-xs font-bold uppercase tracking-[.12em] text-destructive-foreground hover:bg-destructive/90 sm:px-5" onClick={() => setAccusing(true)}><Gavel className="size-4" /> <span className="hidden sm:inline">Accuse Suspect</span><span className="sm:hidden">Accuse</span></Button>
        </header>

        <div className="flex items-center gap-2 overflow-x-auto border-b bg-panel px-4 py-2 lg:hidden">
          {(Object.keys(suspects) as SuspectId[]).map((id) => <Button key={id} size="sm" variant={id === suspectId ? "default" : "ghost"} onClick={() => setSuspectId(id)}>{suspects[id].name.split(" ")[0]}</Button>)}
          <Button size="sm" variant="outline" onClick={() => setEvidenceOpen(true)}><Search /> Evidence</Button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[286px_minmax(400px,1fr)_300px]">
          <Dossier suspectId={suspectId} onSelect={setSuspectId} />
          <Interrogation key={suspectId} suspectId={suspectId} onEvidence={() => setEvidenceOpen(true)} />
          <EvidenceDrawer className="hidden lg:flex" onUse={() => {}} />
        </div>
      </section>

      {evidenceOpen && <div className="fixed inset-0 z-50 flex justify-end bg-background/75 backdrop-blur-sm lg:hidden" onClick={() => setEvidenceOpen(false)}><EvidenceDrawer className="w-[88%] max-w-sm" onClose={() => setEvidenceOpen(false)} onUse={(prompt) => { window.dispatchEvent(new CustomEvent("use-evidence", { detail: prompt })); setEvidenceOpen(false); }} /></div>}
      {navOpen && <div className="fixed inset-0 z-50 bg-background/85 lg:hidden" onClick={() => setNavOpen(false)}><aside className="h-full w-72 border-r bg-panel p-5" onClick={(e) => e.stopPropagation()}><div className="mb-8 flex items-center justify-between"><p className="font-display text-xl">Blackwood Casefiles</p><Button variant="ghost" size="icon" onClick={() => setNavOpen(false)}><X /></Button></div>{nav.map(({icon:Icon,label,active}) => <button key={label} className={`mb-2 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm ${active ? "bg-accent text-primary" : "text-muted-foreground"}`}><Icon className="size-4" />{label}</button>)}</aside></div>}
      {accusing && <AccuseDialog current={suspectId} onClose={() => setAccusing(false)} />}
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="flex items-center gap-2"><Icon className="size-4 text-primary" /><div><p className="text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="font-mono text-xs font-semibold">{value}</p></div></div>;
}

function Dossier({ suspectId, onSelect }: { suspectId: SuspectId; onSelect: (id: SuspectId) => void }) {
  const suspect = suspects[suspectId];
  return <aside className="hidden min-h-0 flex-col overflow-y-auto border-r bg-panel lg:flex">
    <div className="relative aspect-[4/3] overflow-hidden border-b"><img src={suspect.image} alt={suspect.name} className="h-full w-full object-cover object-[center_28%] grayscale-[18%]" width={768} height={1024} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-panel to-transparent p-4 pt-16"><p className="font-display text-2xl">{suspect.name}</p><p className="text-[10px] uppercase tracking-[.18em] text-primary">{suspect.role}</p></div></div>
    <div className="space-y-5 p-4"><div className="grid grid-cols-3 gap-2">{(Object.keys(suspects) as SuspectId[]).map(id => <button key={id} onClick={() => onSelect(id)} className={`overflow-hidden rounded-sm border ${id === suspectId ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}><img src={suspects[id].image} alt={suspects[id].name} className="aspect-square w-full object-cover object-top" width={768} height={1024} loading="lazy" /></button>)}</div>
      <Info label="Profile" text={`${suspect.age} years old · ${suspect.bio}`} /><Info label="Alibi" text={suspect.alibi} /><Info label="Relationship" text={suspect.relation} />
      <div><div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-[.16em]"><span>Stress level</span><span className="text-primary">{suspect.stress}% · Elevated</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="stress-pulse h-full bg-primary" style={{ width: `${suspect.stress}%` }} /></div></div>
    </div>
  </aside>;
}

function Info({ label, text }: { label: string; text: string }) { return <div><p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">{label}</p><p className="text-xs leading-5 text-foreground/85">{text}</p></div>; }

function Interrogation({ suspectId, onEvidence }: { suspectId: SuspectId; onEvidence: () => void }) {
  const suspect = suspects[suspectId];
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [press, setPress] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { suspectId, press } }), [suspectId, press]);
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({ id: `blackwood-${suspectId}`, transport, onFinish: () => inputRef.current?.focus() });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { const saved = localStorage.getItem(`blackwood-chat-${suspectId}`); if (saved) { try { setMessages(JSON.parse(saved) as UIMessage[]); } catch { localStorage.removeItem(`blackwood-chat-${suspectId}`); } } setStorageReady(true); inputRef.current?.focus(); }, [setMessages, suspectId]);
  useEffect(() => { if (storageReady && !busy) localStorage.setItem(`blackwood-chat-${suspectId}`, JSON.stringify(messages)); }, [messages, busy, storageReady, suspectId]);
  useEffect(() => { const handle = (event: Event) => { const custom = event as CustomEvent<string>; setInput(custom.detail); inputRef.current?.focus(); }; window.addEventListener("use-evidence", handle); return () => window.removeEventListener("use-evidence", handle); }, []);
  const submit = (text: string) => { if (!text.trim() || busy) return; void sendMessage({ text: `${press ? "[PRESSING] " : ""}${text.trim()}` }); setInput(""); inputRef.current?.focus(); };
  const visible = messages.length ? messages : [{ id: "opening", role: "assistant", parts: [{ type: "text", text: suspect.opener }] } as UIMessage];
  return <section className="flex min-h-[calc(100dvh-106px)] min-w-0 flex-col bg-background lg:min-h-0">
    <div className="flex items-center justify-between border-b px-4 py-3"><div className="flex items-center gap-3"><img src={suspect.image} alt="" className="size-9 rounded-full object-cover object-top ring-1 ring-primary/50" width={768} height={1024} loading="lazy" /><div><p className="text-xs font-semibold">Interrogating {suspect.name}</p><p className="flex items-center gap-1 text-[10px] text-success"><span className="size-1.5 rounded-full bg-success" /> Recording active</p></div></div><Button variant="ghost" size="icon" className="lg:hidden" onClick={onEvidence} aria-label="Open evidence"><Paperclip /></Button></div>
    <Conversation className="min-h-0"><ConversationContent className="mx-auto w-full max-w-2xl gap-6 px-4 py-7 sm:px-8">{visible.map((message) => <Message from={message.role} key={message.id} className={message.role === "assistant" ? "before:mb-1 before:text-[9px] before:font-bold before:uppercase before:tracking-[.18em] before:text-primary before:content-['SUSPECT']" : "before:mb-1 before:text-right before:text-[9px] before:font-bold before:uppercase before:tracking-[.18em] before:text-muted-foreground before:content-['YOU']"}><MessageContent className={message.role === "user" ? "border border-primary/25 bg-accent text-accent-foreground" : "font-display text-[17px] leading-7"}>{message.parts.map((part, i) => part.type === "text" ? <MessageResponse key={i}>{part.text.replace(/^\[PRESSING\]\s*/, "")}</MessageResponse> : null)}</MessageContent></Message>)}{status === "submitted" && <div className="text-xs"><Shimmer>{suspect.name} weighs the question…</Shimmer></div>}{error && <p className="rounded-sm border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">{error.message}</p>}</ConversationContent><ConversationScrollButton /></Conversation>
    <div className="border-t bg-panel p-3 sm:p-4"><PromptInput className="mx-auto max-w-2xl border-border bg-panel-raised shadow-xl" onSubmit={({text}) => submit(text)}><PromptInputTextarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Question ${suspect.name.split(" ")[0]}…`} className="min-h-20 text-sm" /><PromptInputFooter><PromptInputTools><Button type="button" size="sm" variant={press ? "default" : "ghost"} onClick={() => setPress(!press)} className="h-8 text-[10px] uppercase tracking-[.12em]"><Mic2 /> Press suspect</Button><span className="hidden text-[10px] text-muted-foreground sm:inline">Responses may reveal contradictions</span></PromptInputTools><PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && !busy} /></PromptInputFooter></PromptInput></div>
  </section>;
}

function EvidenceDrawer({ className, onClose, onUse }: { className?: string; onClose?: () => void; onUse: (prompt: string) => void }) {
  return <aside className={`min-h-0 flex-col border-l bg-panel ${className ?? ""}`} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b px-4 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-primary">Evidence drawer</p><h2 className="font-display text-lg">Discovered clues</h2></div>{onClose && <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>}</div><div className="flex-1 space-y-2 overflow-y-auto p-3">{evidence.map((clue, index) => <button key={clue.id} onClick={() => { if (onUse) onUse(clue.prompt); else window.dispatchEvent(new CustomEvent("use-evidence", { detail: clue.prompt })); }} className="group w-full rounded-sm border bg-panel-raised p-3 text-left transition-colors hover:border-primary/60 hover:bg-accent"><div className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-sm bg-muted font-mono text-[10px] text-primary">0{index + 1}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{clue.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{clue.detail}</p></div><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></div></button>)}</div><div className="border-t p-4"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[.14em]"><span className="text-muted-foreground">Evidence found</span><span>4 / 8</span></div><div className="h-1 bg-muted"><div className="h-full w-1/2 bg-primary" /></div></div></aside>;
}

function AccuseDialog({ current, onClose }: { current: SuspectId; onClose: () => void }) {
  const [chosen, setChosen] = useState<SuspectId>(current); const [result, setResult] = useState("");
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-background/85 p-4 backdrop-blur-md" onClick={onClose}><div className="w-full max-w-lg rounded-md border bg-panel p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="mb-5 flex justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-primary">Final judgment</p><h2 className="font-display text-2xl">Name your suspect</h2></div><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></div><div className="grid gap-2 sm:grid-cols-3">{(Object.keys(suspects) as SuspectId[]).map(id => <button key={id} onClick={() => { setChosen(id); setResult(""); }} className={`rounded-sm border p-2 text-left ${chosen === id ? "border-primary bg-accent" : "bg-panel-raised"}`}><img src={suspects[id].image} alt="" className="mb-2 aspect-[4/3] w-full object-cover object-top" width={768} height={1024} loading="lazy" /><p className="text-xs font-semibold">{suspects[id].name}</p></button>)}</div>{result && <p className="mt-4 border-l-2 border-primary bg-accent p-3 text-sm">{result}</p>}<Button className="mt-5 w-full" onClick={() => setResult(chosen === "butler" ? "A precise deduction. Arthur moved the clock to protect the family—but his own timeline exposed him." : "The evidence does not hold. Revisit the stopped watch and the silver tea tray.")}><ShieldCheck /> Submit accusation</Button></div></div>;
}