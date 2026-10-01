import { Check, Search } from "lucide-react";
import sceneImage from "@/assets/crime-scene-study.jpg";
import { clueById, hotspots, type ClueId } from "@/game/case";
import { Eyebrow, Overlay, Rich } from "./ui";

export function CrimeScene({ found, onDiscover, onClose }: { found: ClueId[]; onDiscover: (id: ClueId) => void; onClose: () => void }) {
  const left = hotspots.filter((h) => !found.includes(h.clue)).length;
  return (
    <Overlay label="Crime scene" onClose={onClose} className="max-w-5xl p-0">
      <div className="p-5 pb-3"><Eyebrow>Crime scene · Alistair's study</Eyebrow><h2 className="font-display text-2xl">Search the room</h2><p className="text-sm text-muted-foreground">Tap the glowing spots. {left ? <><strong className="text-amber-soft">{left} hidden clue{left > 1 ? "s" : ""}</strong> left.</> : "You've searched everything."}</p></div>
      <div className="relative overflow-hidden border-y">
        <img src={sceneImage} alt="Alistair Blackwood's study at night" width={1536} height={1024} className="w-full" />
        {hotspots.map((h) => {
          const done = found.includes(h.clue);
          return (
            <button key={h.id} onClick={() => !done && onDiscover(h.clue)} aria-label={done ? `${h.label} (searched)` : `Search ${h.label}`} style={{ left: `${h.x}%`, top: `${h.y}%` }} className="group absolute -translate-x-1/2 -translate-y-1/2">
              <span className={`grid size-9 place-items-center rounded-full border-2 backdrop-blur-sm transition-transform group-hover:scale-110 ${done ? "border-success/70 bg-background/60 text-success" : "hotspot-glow border-primary bg-background/40 text-primary"}`}>{done ? <Check className="size-4" /> : <Search className="size-4" />}</span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-sm bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold">{h.label}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-3">
        {hotspots.filter((h) => found.includes(h.clue)).map((h) => { const c = clueById(h.clue); return <div key={h.id} className="rounded-sm border bg-panel-raised p-2.5 text-xs"><p className="font-semibold">{c.title}</p><p className="mt-1 text-muted-foreground"><Rich text={c.detail} /></p></div>; })}
      </div>
    </Overlay>
  );
}
