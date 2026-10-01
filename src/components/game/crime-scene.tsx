import { Check, Search, Sparkles } from "lucide-react";
import { clueOf, useCase, type ClueId } from "@/game/case";
import galaScene from "@/assets/gala-crime-scene-cinematic.jpg";
import { Eyebrow, Overlay, Rich } from "./ui";

export function CrimeScene({ found, onDiscover, onClose }: { found: ClueId[]; onDiscover: (id: ClueId) => void; onClose: () => void }) {
  const C = useCase(); const { hotspots } = C; const clueById = (id: ClueId) => clueOf(C, id);
  const cinematicGala = C.code === "002";
  const sceneImage = cinematicGala ? galaScene : C.scene.image;
  const galaHotspots: Record<string, { x: number; y: number }> = {
    junction: { x: 92, y: 24 }, office: { x: 15, y: 31 }, case: { x: 48, y: 38 }, reader: { x: 78, y: 34 }, radio: { x: 18, y: 82 },
  };
  const left = hotspots.filter((h) => !found.includes(h.clue)).length;
  return (
    <Overlay label="Crime scene" onClose={onClose} className="max-w-6xl overflow-hidden p-0">
      <div className="flex items-end justify-between gap-4 p-5 pb-3"><div><Eyebrow>Crime scene · {C.scene.label}</Eyebrow><h2 className="font-display text-2xl sm:text-3xl">Search the room</h2><p className="text-sm text-muted-foreground">Tap a glowing point to collect what the room is hiding.</p></div><div className="shrink-0 rounded-sm border bg-panel-raised px-3 py-2 text-right"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">Unsearched</p><p className="font-display text-2xl text-primary">{left}</p></div></div>
      <div className="cinematic-scene relative overflow-hidden border-y">
        <img src={sceneImage} alt={C.scene.alt} width={1920} height={1280} className="aspect-[3/2] w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" />
        {cinematicGala && <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-sm border bg-background/75 px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur"><Sparkles className="size-3.5 text-primary" /> Aldridge Museum · 11:58 PM</div>}
        {hotspots.map((h) => {
          const done = found.includes(h.clue);
          const point = cinematicGala ? galaHotspots[h.id] : undefined;
          return (
            <button key={h.id} onClick={() => !done && onDiscover(h.clue)} aria-label={done ? `${h.label} (searched)` : `Search ${h.label}`} style={{ left: `${point?.x ?? h.x}%`, top: `${point?.y ?? h.y}%` }} className="group absolute -translate-x-1/2 -translate-y-1/2">
              <span className={`relative grid size-11 place-items-center rounded-full border-2 backdrop-blur-md transition-transform group-hover:scale-110 ${done ? "border-success/70 bg-background/70 text-success" : "hotspot-glow border-primary bg-background/55 text-primary"}`}>{done ? <Check className="size-4" /> : <Search className="size-4" />}</span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-sm border bg-background/90 px-2 py-1 text-[10px] font-semibold shadow-lg">{done ? "Searched · " : "Inspect · "}{h.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 overflow-x-auto p-4">
        {hotspots.filter((h) => found.includes(h.clue)).map((h) => { const c = clueById(h.clue); return <div key={h.id} className="min-w-56 flex-1 rounded-sm border bg-panel-raised p-2.5 text-xs"><p className="flex items-center gap-1.5 font-semibold"><Check className="size-3.5 text-success" />{c.title}</p><p className="mt-1 line-clamp-2 text-muted-foreground"><Rich text={c.detail} /></p></div>; })}
      </div>
    </Overlay>
  );
}
