import { useEffect, useRef, useState } from "react";
import { Copy, Radio, UserPlus, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { createLobby, getLobby, joinLobby, saveLobbyOutcome, updateLobby, type LobbyState } from "@/lib/lobby.functions";
import { Eyebrow, Overlay } from "./ui";

type Credentials = { roomId: string; memberToken: string; inviteCode: string };
const read = (key: string): Credentials | null => { try { return JSON.parse(localStorage.getItem(key) ?? "null") as Credentials | null; } catch { return null; } };

export function CaseLobby({ caseCode, storageKey, clues, progress, onSharedClues, onSharedProgress }: { caseCode: string; storageKey: string; clues: string[]; progress: number; onSharedClues: (clues: string[]) => void; onSharedProgress: (progress: number) => void }) {
  const key = `${storageKey}-lobby`; const create = useServerFn(createLobby); const join = useServerFn(joinLobby); const refresh = useServerFn(getLobby); const update = useServerFn(updateLobby); const saveOutcome = useServerFn(saveLobbyOutcome);
  const [open, setOpen] = useState(false); const [mode, setMode] = useState<"start" | "create" | "join">("start");
  const [name, setName] = useState(""); const [code, setCode] = useState(""); const [credentials, setCredentials] = useState<Credentials | null>(null); const [state, setState] = useState<LobbyState | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const lastSent = useRef("");
  const outcomeSeen = useRef(false);

  useEffect(() => { setCredentials(read(key)); }, [key]);
  useEffect(() => {
    if (!credentials) return;
    let live = true;
    const poll = async () => { try { const next = await refresh({ data: credentials }); if (!live) return; setState(next); onSharedClues(next.clues); onSharedProgress(next.progress); if (next.outcome && !outcomeSeen.current) { outcomeSeen.current = true; setOpen(true); } } catch { if (live) setError("This room is no longer available."); } };
    void poll(); const timer = window.setInterval(poll, 3500); return () => { live = false; window.clearInterval(timer); };
  }, [credentials, onSharedClues, onSharedProgress]);
  useEffect(() => {
    if (!credentials) return; const signature = [...clues].sort().join("|") + progress; if (signature === lastSent.current) return; lastSent.current = signature;
    void update({ data: { ...credentials, clues, progress, event: "A teammate advanced the investigation." } }).then(setState).catch(() => undefined);
  }, [credentials, clues, progress]);
  useEffect(() => {
    const listener = (event: Event) => { if (!credentials) return; const detail = (event as CustomEvent<{ won: boolean; score: number; rating: string }>).detail; void saveOutcome({ data: { ...credentials, outcome: detail } }).then(setState).catch(() => undefined); };
    window.addEventListener("case-outcome", listener); return () => window.removeEventListener("case-outcome", listener);
  }, [credentials]);

  const enter = async (kind: "create" | "join") => { setBusy(true); setError(""); try { const selectedCase = caseCode as "001" | "002"; const result = kind === "create" ? await create({ data: { caseCode: selectedCase, displayName: name, clues } }) : await join({ data: { inviteCode: code, displayName: name, caseCode: selectedCase } }); const next = { roomId: result.roomId, memberToken: result.memberToken ?? "", inviteCode: result.inviteCode ?? code }; localStorage.setItem(key, JSON.stringify(next)); setCredentials(next); setState(result); setMode("start"); } catch (cause) { setError(cause instanceof Error ? cause.message : "The room could not be opened."); } finally { setBusy(false); } };
  const leave = () => { localStorage.removeItem(key); setCredentials(null); setState(null); setOpen(false); };
  return <>
    <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Users /> <span className="hidden sm:inline">{credentials ? `${state?.members.length ?? 1} playing` : "Play together"}</span>{credentials && <span className="size-1.5 rounded-full bg-success" />}</Button>
    {open && <Overlay label="Case room" onClose={() => setOpen(false)} className="max-w-lg">
      {credentials ? <><Eyebrow>Live case room</Eyebrow><h2 className="font-display text-2xl">Investigate together</h2><p className="mt-1 text-sm text-muted-foreground">Clues and the final result are shared. Interviews, stress, notes, and intuition stay private.</p>
        <div className="mt-4 rounded-sm border border-primary/40 bg-accent/50 p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Invite code</p><div className="mt-1 flex items-center gap-2"><strong className="flex-1 font-mono text-xl tracking-[.18em]">{credentials.inviteCode}</strong><Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(credentials.inviteCode)} aria-label="Copy invite code"><Copy /></Button></div></div>
        <div className="mt-4"><p className="mb-2 text-xs font-semibold">Players in the room</p><div className="space-y-2">{state?.members.map((member, index) => <div key={`${member.name}-${index}`} className="flex items-center gap-2 rounded-sm border bg-panel-raised px-3 py-2 text-sm"><span className={`size-2 rounded-full ${member.active ? "bg-success" : "bg-muted-foreground"}`} />{member.name}</div>)}</div></div>
        {state?.lastEvent && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Radio className="size-3.5 text-primary" />{state.lastEvent.text}</p>}
        {state?.outcome && <div className="mt-4 border-l-2 border-primary bg-accent/50 p-4 text-center"><Eyebrow>{state.outcome.won ? "Case closed" : "Case unsolved"}</Eyebrow><p className="font-display text-2xl">{state.outcome.rating}</p><p className="font-mono text-xs text-muted-foreground">Team score {state.outcome.score}/100</p></div>}
        <Button className="mt-5 w-full" variant="outline" onClick={leave}>Leave room</Button></> : <><Eyebrow>Cooperative investigation</Eyebrow><h2 className="font-display text-2xl">Bring another detective</h2><p className="mt-1 text-sm text-muted-foreground">No account needed. Share one invite code and investigate the same case.</p>
        {mode === "start" ? <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button onClick={() => setMode("create")}><Users /> Create room</Button><Button variant="outline" onClick={() => setMode("join")}><UserPlus /> Join room</Button></div> : <div className="mt-5 space-y-3"><label className="block text-xs font-semibold">Your display name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm font-normal outline-none focus:border-primary" /></label>{mode === "join" && <label className="block text-xs font-semibold">Invite code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 font-mono text-sm font-normal uppercase tracking-[.14em] outline-none focus:border-primary" /></label>}<Button className="w-full" disabled={busy || !name.trim() || (mode === "join" && code.length !== 10)} onClick={() => enter(mode)}>{busy ? "Opening room…" : mode === "create" ? "Create invite" : "Join investigation"}</Button><Button className="w-full" variant="ghost" onClick={() => setMode("start")}>Back</Button></div>}{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</>}
    </Overlay>}
  </>;
}