import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ChevronDown, ChevronUp, Eye, Mic2, ScanEye, Sparkle, Target, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { clueOf, useCase, type ClueId, type PersonId } from "@/game/case";

export type Meta = { stress: number; observation: string; tell: string; jane?: string | undefined };
export type Action = "coldread" | "bluff" | "detail" | "blink";
const ACTIONS: Record<Action, { tag: string; label: string; line: string }> = {
  coldread: { tag: "COLD READ", label: "Cold read", line: "Jane studies them closely before speaking." },
  bluff: { tag: "TRAP: BLUFF", label: "Bluff about evidence", line: "We have a witness who saw you near the study just before ten." },
  detail: { tag: "TRAP: KILLER'S DETAIL", label: "Mention a detail only the killer knows", line: "Funny thing. Whoever did this swept the broken glass into a neat little pile." },
  blink: { tag: "TRAP: BLINK RATE", label: "Observe eye blink rate", line: "(You quietly watch their eyes.) Tell me again where you were at ten to ten." },
};

export function parseReply(text: string): { speech: string; meta?: Meta | undefined } {
  const i = text.indexOf("<<META");
  if (i < 0) return { speech: text };
  const m = text.slice(i).match(/<<META\s*(\{[\s\S]*\})\s*>>/);
  let meta: Meta | undefined;
  if (m) { try { const p = JSON.parse(m[1] ?? ""); meta = { stress: Math.max(0, Math.min(100, Math.round(Number(p.stress) || 0))), observation: String(p.observation ?? ""), tell: String(p.tell ?? ""), jane: p.jane ? String(p.jane) : undefined }; } catch { /* partial */ } }
  return { speech: text.slice(0, i).trim(), meta };
}

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export function Interrogation({ suspectId, stress, injected, onMeta, onCount, header, clueStrip }: {
  suspectId: PersonId; stress: number; injected: { id: ClueId; n: number } | null;
  onMeta: (m: Meta) => void; onCount: (n: number) => void; header?: ReactNode; clueStrip?: ReactNode;
}) {
  const C = useCase(); const K = C.storageKey; const clueById = (id: ClueId) => clueOf(C, id);
  const suspect = C.people[suspectId]!;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [press, setPress] = useState(false);
  const [trapOpen, setTrapOpen] = useState(false);
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [coldReadVisual, setColdReadVisual] = useState(false);
  const [clueId, setClueId] = useState<ClueId | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({ id: `${K}-${suspectId}`, transport, onFinish: () => inputRef.current?.focus() });
  const busy = status === "submitted" || status === "streaming";
  const cb = useRef({ onMeta, onCount }); cb.current = { onMeta, onCount };

  useEffect(() => { const saved = localStorage.getItem(`${K}-chat-${suspectId}`); if (saved) { try { setMessages(JSON.parse(saved) as UIMessage[]); } catch { localStorage.removeItem(`${K}-chat-${suspectId}`); } } setStorageReady(true); }, [setMessages, suspectId]);
  useEffect(() => { if (storageReady && !busy) localStorage.setItem(`${K}-chat-${suspectId}`, JSON.stringify(messages)); }, [messages, busy, storageReady, suspectId]);
  useEffect(() => { if (storageReady) cb.current.onCount(messages.filter((m) => m.role === "user").length); }, [messages, storageReady]);
  useEffect(() => {
    if (busy) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]; if (!m || m.role !== "assistant") continue;
      const { meta } = parseReply(textOf(m)); if (meta) { cb.current.onMeta(meta); return; }
    }
  }, [messages, busy]);
  useEffect(() => { if (!injected) return; const c = clueById(injected.id); setInput(c.prompt); setClueId(c.id); inputRef.current?.focus(); }, [injected]);
  useEffect(() => { const f = () => inputRef.current?.focus(); window.addEventListener("focus-question", f); return () => window.removeEventListener("focus-question", f); }, []);

  const submit = (text: string, action?: Action) => {
    if (!text.trim() || busy) return;
    const c = clueId ? clueById(clueId) : null;
    const tag = action ? `[${ACTIONS[action].tag}] ` : press ? "[PRESSING] " : "";
    void sendMessage({ text: `${tag}${text.trim()}` }, { body: { caseCode: C.code, suspectId, press, stress, action: action ?? null, evidence: c ? { title: c.title, detail: c.detail.replace(/\*\*/g, "") } : null } });
    if (action === "coldread") { setColdReadVisual(true); window.setTimeout(() => setColdReadVisual(false), 2400); }
    if (!action) { setInput(""); setClueId(null); }
    setTrapOpen(false); inputRef.current?.focus();
  };
  const visible = messages.length ? messages : [{ id: "opening", role: "assistant", parts: [{ type: "text", text: suspect.opener }] } as UIMessage];

  return (
    <section className="flex min-h-[60dvh] min-w-0 flex-1 flex-col bg-background lg:min-h-0">
      {header}
      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-2xl gap-6 px-4 py-6 sm:px-8">
          {visible.map((message) => {
            const raw = textOf(message);
            const tagMatch = message.role === "user" ? raw.match(/^\[([^\]]+)\]\s*/) : null;
            const parsed = message.role === "assistant" ? parseReply(raw) : { speech: tagMatch ? raw.slice(tagMatch[0].length) : raw, meta: undefined };
            const speech = parsed.speech.replace(/[\u2014\u2013]/g, ",");
            const meta = parsed.meta;
            return (
              <Message from={message.role} key={message.id}>
                <p className={`text-[9px] font-bold uppercase tracking-[.18em] ${message.role === "user" ? "text-right text-muted-foreground" : "text-primary"}`}>{message.role === "user" ? "You" : suspect.short}</p>
                {tagMatch && <p className="text-right text-[9px] font-bold uppercase tracking-[.16em] text-primary">{tagMatch[1]}</p>}
                {meta?.jane && <div className="rounded-sm border-l-2 border-primary bg-accent/60 px-3 py-2 text-xs italic"><span className="mr-1 font-bold not-italic text-primary">JANE:</span>{meta.jane}</div>}
                {meta?.observation && <p className="w-fit rounded-sm border border-border bg-muted/60 px-2 py-0.5 text-[10px] italic text-muted-foreground">[{meta.observation}]</p>}
                <MessageContent className={message.role === "user" ? "border border-primary/25 bg-accent text-accent-foreground" : "font-display text-[17px] leading-7"}>
                  {speech ? <MessageResponse>{speech}</MessageResponse> : null}
                </MessageContent>
              </Message>
            );
          })}
          {status === "submitted" && <div className="text-xs"><Shimmer>{`${suspect.short} weighs the question…`}</Shimmer></div>}
          {error && <p className="rounded-sm border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t bg-panel p-3 sm:p-4">
        {clueStrip}
        {clueId && <p className="mx-auto mb-2 flex max-w-2xl items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-primary">Showing clue: {clueById(clueId).title}<button aria-label="Remove clue" onClick={() => setClueId(null)}><X className="size-3 text-muted-foreground" /></button></p>}
        {tacticsOpen && <div className="mx-auto mb-2 max-w-2xl rounded-md border bg-popover p-2 shadow-xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Optional tactics</p>
          <div className="grid gap-1 sm:grid-cols-3"><Button type="button" size="sm" variant={press ? "default" : "outline"} onClick={() => setPress(!press)} className="justify-start"><Mic2 /> {press ? "Pressing is on" : "Press harder"}</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => submit(ACTIONS.coldread.line, "coldread")} className="justify-start"><Eye /> Cold read</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setTrapOpen(!trapOpen)} className="justify-start"><Target /> Set a trap</Button></div>
          {trapOpen && <div className="mt-2 grid gap-1 sm:grid-cols-3">{(["bluff", "detail", "blink"] as Action[]).map((a) => <button key={a} type="button" onClick={() => submit(ACTIONS[a].line, a)} className="flex w-full items-start gap-2 rounded-sm border bg-panel-raised px-2.5 py-2 text-left text-xs hover:bg-accent"><Sparkle className="mt-0.5 size-3 shrink-0 text-primary" /><span><span className="block font-semibold">{ACTIONS[a].label}</span><span className="text-muted-foreground">{ACTIONS[a].line}</span></span></button>)}</div>}
        </div>}
        <PromptInput className="mx-auto max-w-2xl border-border bg-panel-raised shadow-xl" onSubmit={({ text }) => submit(text)}>
          <PromptInputTextarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`What do you want to ask ${suspect.short}?`} className="min-h-16 text-sm" />
          <PromptInputFooter>
            <PromptInputTools><Button type="button" size="sm" variant="ghost" onClick={() => setTacticsOpen(!tacticsOpen)} aria-expanded={tacticsOpen} className="h-8 text-xs">More tactics {tacticsOpen ? <ChevronUp /> : <ChevronDown />}</Button></PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && !busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
      {coldReadVisual && <div className="pointer-events-none fixed inset-0 z-[75] grid place-items-center bg-background/80 p-5 backdrop-blur-sm animate-in fade-in">
        <div className="cold-read-frame relative w-full max-w-md overflow-hidden rounded-md border border-primary bg-panel shadow-2xl">
          <img src={suspect.image} alt="" className="aspect-[4/3] w-full object-cover object-top opacity-80" width={768} height={1024} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><ScanEye className="size-4" /> Cold read</p><p className="mt-2 font-display text-xl italic">Don’t listen to the answer. Watch the moment before it.</p></div>
          <span className="cold-read-scan absolute inset-x-0 h-px bg-primary" />
        </div>
      </div>}
    </section>
  );
}
