import { useEffect, useRef, useState } from "react";
import { Disc3, FolderClosed, FolderOpen, Lock, Pause, Play, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CASES, lockedCases, useCase } from "@/game/case";
import recordAsset from "@/assets/st-louis-blues.mp3.asset.json";
import { Eyebrow, Overlay, Rich } from "./ui";

export function Desk({ playing, onTogglePlay, calm, onToggleCalm, onOpenCases, onPick, onClose }: {
  playing: boolean; onTogglePlay: () => void; calm: boolean; onToggleCalm: () => void; onOpenCases: () => void; onPick: (code: string) => void; onClose: () => void;
}) {
  const C = useCase(); const { suspectIds: SUSPECT_IDS, suspects, timeline } = C;
  const [notes, setNotes] = useState("");
  useEffect(() => { setNotes(localStorage.getItem(`${C.storageKey}-notes`) ?? ""); }, []);
  const saveNotes = (v: string) => { setNotes(v); localStorage.setItem(`${C.storageKey}-notes`, v); };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.5;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <Overlay label="My desk" onClose={onClose} className="max-w-4xl border-wood bg-gradient-to-b from-leather/40 to-panel p-0">
      <div className="border-b border-wood/60 p-5"><Eyebrow>CBI · Jane's corner</Eyebrow><h2 className="font-display text-2xl">My desk</h2><p className="text-sm text-muted-foreground">Leather couch, cold tea, quiet thoughts. Nothing here can hurt your case.</p></div>
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-md border border-wood bg-wood/40 p-4">
            <div className={`grid size-20 shrink-0 place-items-center rounded-full border-4 border-background bg-background ${playing ? "record-spin" : ""}`}><Disc3 className="size-16 text-primary/80" /></div>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Record player</p><p className="font-display text-lg">Midnight at the CBI</p><p className="text-xs text-muted-foreground">Soft noir jazz</p>
<Button size="sm" variant="outline" className="mt-2" onClick={onTogglePlay}>{playing ? <><Pause /> Stop</> : <><Play /> Play</>}</Button>
              <audio ref={audioRef} src={recordAsset.url} loop preload="auto" /></div>
          </div>
          <div className="rounded-md border border-wood bg-wood/30 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Case folders</p>
            {Object.values(CASES).map((k) => <button key={k.code} onClick={() => onPick(k.code)} className={`mb-1.5 flex w-full items-center gap-3 rounded-sm p-2.5 text-left ${k.code === C.code ? "bg-accent" : "hover:bg-muted"}`}><FolderOpen className="size-5 text-primary" /><span className="text-sm font-semibold">{k.code} · {k.title}</span></button>)}
            {lockedCases.map((c) => <button key={c.code} onClick={onOpenCases} className="mt-1.5 flex w-full items-center gap-3 rounded-sm p-2.5 text-left text-muted-foreground hover:bg-muted"><FolderClosed className="size-5" /><span className="flex-1 text-sm">{c.code} · {c.title}</span><Lock className="size-3.5" /></button>)}
          </div>
          <div className={`rounded-md border p-4 ${calm ? "border-success/60 bg-success/10" : "border-wood bg-wood/30"}`}>
            <p className="flex items-center gap-2 text-sm font-semibold"><Wind className="size-4 text-primary" /> Take a Breath</p>
            <p className="mt-1 text-xs text-muted-foreground">Pauses the case timer so you can read, think and line up the timeline at your own pace.</p>
            <Button size="sm" className="mt-3" variant={calm ? "outline" : "default"} onClick={onToggleCalm}>{calm ? "Back to the case" : "Take a breath"}</Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-md bg-paper p-4 text-ink shadow-inner">
            <p className="mb-1 font-display text-lg">Notepad</p>
            <textarea value={notes} onChange={(e) => saveNotes(e.target.value)} placeholder="Who lied? What doesn't fit?…" className="h-36 w-full resize-none bg-[repeating-linear-gradient(transparent,transparent_23px,color-mix(in_oklch,var(--color-ink)_15%,transparent)_24px)] bg-transparent font-display text-[15px] leading-6 text-ink outline-none placeholder:text-ink/40" />
          </div>
          <div className="rounded-md border border-wood bg-wood/30 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Timeline of the night</p>
            <ol className="space-y-1.5">{timeline.map((t) => <li key={t.time + t.text} className="flex gap-3 text-xs"><span className="w-16 shrink-0 font-mono text-primary">{t.time}</span><span className={t.claimed ? "italic text-muted-foreground" : ""}><Rich text={t.text} /></span></li>)}</ol>
            <p className="mt-2 text-[10px] text-muted-foreground">Italic = only the suspect's word.</p>
          </div>
          {calm && <div className="rounded-md border border-wood bg-wood/30 p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">Dossiers</p>{SUSPECT_IDS.map((id) => <div key={id} className="mb-2 text-xs"><p className="font-semibold">{suspects[id]!.name}</p><p className="text-muted-foreground"><Rich text={`${suspects[id]!.alibi} ${suspects[id]!.motive}`} /></p></div>)}</div>}
        </div>
      </div>
    </Overlay>
  );
}
