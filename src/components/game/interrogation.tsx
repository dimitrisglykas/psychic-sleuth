import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Mic2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { clueById, suspects, type ClueId, type SuspectId } from "@/game/case";

export type Meta = { stress: number; observation: string; tell: string };

export function parseReply(text: string): { speech: string; meta?: Meta | undefined } {
  const i = text.indexOf("<<META");
  if (i < 0) return { speech: text };
  const m = text.slice(i).match(/<<META\s*(\{[\s\S]*\})\s*>>/);
  let meta: Meta | undefined;
  if (m) { try { const p = JSON.parse(m[1] ?? ""); meta = { stress: Math.max(0, Math.min(100, Math.round(Number(p.stress) || 0))), observation: String(p.observation ?? ""), tell: String(p.tell ?? "") }; } catch { /* partial */ } }
  return { speech: text.slice(0, i).trim(), meta };
}

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export function Interrogation({ suspectId, stress, injected, onMeta, onCount, header, clueStrip }: {
  suspectId: SuspectId; stress: number; injected: { id: ClueId; n: number } | null;
  onMeta: (m: Meta) => void; onCount: (n: number) => void; header?: ReactNode; clueStrip?: ReactNode;
}) {
  const suspect = suspects[suspectId];
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [press, setPress] = useState(false);
  const [clueId, setClueId] = useState<ClueId | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({ id: `blackwood-${suspectId}`, transport, onFinish: () => inputRef.current?.focus() });
  const busy = status === "submitted" || status === "streaming";
  const cb = useRef({ onMeta, onCount }); cb.current = { onMeta, onCount };

  useEffect(() => { const saved = localStorage.getItem(`blackwood-chat-${suspectId}`); if (saved) { try { setMessages(JSON.parse(saved) as UIMessage[]); } catch { localStorage.removeItem(`blackwood-chat-${suspectId}`); } } setStorageReady(true); }, [setMessages, suspectId]);
  useEffect(() => { if (storageReady && !busy) localStorage.setItem(`blackwood-chat-${suspectId}`, JSON.stringify(messages)); }, [messages, busy, storageReady, suspectId]);
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

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    const c = clueId ? clueById(clueId) : null;
    void sendMessage({ text: `${press ? "[PRESSING] " : ""}${text.trim()}` }, { body: { suspectId, press, stress, evidence: c ? { title: c.title, detail: c.detail.replace(/\*\*/g, "") } : null } });
    setInput(""); setClueId(null); inputRef.current?.focus();
  };
  const visible = messages.length ? messages : [{ id: "opening", role: "assistant", parts: [{ type: "text", text: suspect.opener }] } as UIMessage];

  return (
    <section className="flex min-h-[60dvh] min-w-0 flex-1 flex-col bg-background lg:min-h-0">
      {header}
      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-2xl gap-6 px-4 py-6 sm:px-8">
          {visible.map((message) => {
            const raw = textOf(message);
            const { speech, meta } = message.role === "assistant" ? parseReply(raw) : { speech: raw.replace(/^\[PRESSING\]\s*/, ""), meta: undefined };
            return (
              <Message from={message.role} key={message.id}>
                <p className={`text-[9px] font-bold uppercase tracking-[.18em] ${message.role === "user" ? "text-right text-muted-foreground" : "text-primary"}`}>{message.role === "user" ? "You" : suspect.short}</p>
                {meta?.observation && <p className="text-[11px] italic text-muted-foreground">[{meta.observation}]</p>}
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
        <PromptInput className="mx-auto max-w-2xl border-border bg-panel-raised shadow-xl" onSubmit={({ text }) => submit(text)}>
          <PromptInputTextarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask ${suspect.short} a question…`} className="min-h-16 text-sm" />
          <PromptInputFooter>
            <PromptInputTools><Button type="button" size="sm" variant={press ? "default" : "ghost"} onClick={() => setPress(!press)} className="h-8 text-[10px] uppercase tracking-[.12em]"><Mic2 /> Press suspect</Button></PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && !busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
