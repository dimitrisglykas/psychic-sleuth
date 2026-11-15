import { Check, Search, Sparkles } from "lucide-react";
import { clueOf, useCase, type ClueId } from "@/game/case";
import { Eyebrow, Overlay, Rich } from "./ui";
import { Button } from "@/components/ui/button";

export function CrimeScene({ found, onDiscover, onClose }: { found: ClueId[]; onDiscover: (id: ClueId) => void; onClose: () => void }) {
  const C = useCase(); const { hotspots } = C; const clueById = (id: ClueId) => clueOf(C, id);
  const left = hotspots.filter((h) => !found.includes(h.clue)).length;
  return (
    <Overlay label="Crime scene" onClose={onClose} className="max-w-6xl overflow-hidden p-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 sm:p-6"><div className="min-w-0"><Eyebrow>Crime scene · {C.scene.label}</Eyebrow><h2 className="font-display text-2xl sm:text-3xl">Search the room</h2><p className="text-sm text-muted-foreground">Tap a glowing point to collect what the room is hiding.</p></div><div className="shrink-0 rounded-sm border bg-panel-raised px-3 py-2 text-right"><p className="text-[9px] font-bold uppercase text-muted-foreground">Unsearched</p><p className="font-display text-2xl text-primary">{left}</p></div></div>
      <div className="relative overflow-hidden border-y">
        <img src={C.scene.image} alt={C.scene.alt} width={1920} height={1280} className="cinematic-scene aspect-[3/2] w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" />
        <div className="flex items-center gap-2 bg-panel px-4 py-3 text-[10px] font-semibold"><Sparkles className="size-3.5 shrink-0 text-primary" /> {C.scene.stamp}</div>
        {hotspots.map((h) => {
          const done = found.includes(h.clue);
          return (
            <Button size="icon" variant="ghost" key={h.id} onClick={() => !done && onDiscover(h.clue)} aria-label={done ? `${h.label} (searched)` : `Search ${h.label}`} style={{ left: `${h.x}%`, top: `${h.y}%` }} className="group absolute hidden size-11 -translate-x-1/2 -translate-y-1/2 sm:flex">
              <span className={`relative grid size-11 place-items-center rounded-full border-2 backdrop-blur-md transition-transform group-hover:scale-110 ${done ? "border-success/70 bg-background/70 text-success" : "hotspot-glow border-primary bg-background/55 text-primary"}`}>{done ? <Check className="size-4" /> : <Search className="size-4" />}</span>
            </Button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {hotspots.map((h) => { const c = clueById(h.clue); const done = found.includes(h.clue); return <article key={h.id} className="min-w-0 rounded-sm border bg-panel-raised p-4 text-xs"><Button variant="outline" className="w-full justify-start gap-3 text-left" onClick={() => !done && onDiscover(h.clue)} aria-label={done ? `${h.label} (searched)` : `Search ${h.label}`}>{done ? <Check className="shrink-0 text-success" /> : <Search className="shrink-0 text-primary" />}<span className="min-w-0">{h.label}</span></Button>{done && <><p className="mt-3 font-semibold">{c.title}</p><p className="mt-1 text-muted-foreground"><Rich text={c.detail} /></p></>}</article>; })}
      </div>
    </Overlay>
  );
}
