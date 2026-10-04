import { Eye, FastForward, Files, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseData } from "@/game/case";

type OpeningProps = {
  activeCase: CaseData;
  cases: CaseData[];
  onEnter: () => void;
  onChooseCase: (code: string) => void;
};

const beats = [
  { overline: "Some people watch", title: "You notice", detail: "A glance held too long. A hand protecting a lie." },
  { overline: "Every room remembers", title: "You connect", detail: "Two ordinary details become one impossible story." },
  { overline: "Everyone hides something", title: "You reveal", detail: "Not with magic. With attention." },
];

export function OpeningCredits({ activeCase, cases, onEnter, onChooseCase }: OpeningProps) {
  const [beat, setBeat] = useState(0);
  const [titleReady, setTitleReady] = useState(false);
  const caseImages = useMemo(() => cases.flatMap((item) => [item.scene.image, ...item.suspectIds.map((id) => item.suspects[id]?.image).filter((image): image is string => Boolean(image))]), [cases]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleReady(true);
      return;
    }
    const beatTimers = [window.setTimeout(() => setBeat(1), 1700), window.setTimeout(() => setBeat(2), 3400)];
    const titleTimer = window.setTimeout(() => setTitleReady(true), 5200);
    return () => [...beatTimers, titleTimer].forEach(window.clearTimeout);
  }, []);

  const skip = () => setTitleReady(true);
  const enter = () => {
    sessionStorage.setItem("psychic-opening-seen", "true");
    onEnter();
  };

  return (
    <main className="opening-stage fixed inset-0 z-[100] overflow-hidden bg-background text-foreground" aria-label="Psychic Sleuth opening">
      <div className="absolute inset-0">
        {caseImages.slice(0, 6).map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            className={`opening-frame absolute inset-0 h-full w-full object-cover ${index === beat ? "opening-frame-active" : ""}`}
            width={1280}
            height={720}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="opening-shutter absolute inset-0" />
      </div>

      {!titleReady ? (
        <>
          <Button variant="ghost" size="sm" className="absolute right-4 top-4 z-20" onClick={skip}>
            <FastForward /> Skip opening
          </Button>
          <div className="relative z-10 flex h-full items-center px-6 sm:px-12 lg:px-24">
            <div key={beat} className="opening-credit max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-primary">{beats[beat]?.overline}</p>
              <p className="mt-2 font-display text-5xl leading-none sm:text-7xl">{beats[beat]?.title}</p>
              <p className="mt-4 max-w-md text-sm leading-6 text-foreground/70 sm:text-base">{beats[beat]?.detail}</p>
            </div>
          </div>
          <p className="absolute bottom-6 left-6 z-10 text-[9px] font-bold uppercase tracking-[.24em] text-foreground/55 sm:left-12">An original interactive mystery</p>
        </>
      ) : (
        <div className="opening-title relative z-10 flex h-full flex-col justify-end p-5 sm:justify-center sm:p-12 lg:p-24">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3 text-primary"><span className="grid size-11 place-items-center rounded-full border border-primary/60 bg-background/50 backdrop-blur"><Eye className="size-5" /></span><span className="h-px w-20 bg-primary/60" /></div>
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">An original mystery series</p>
            <h1 className="mt-2 font-display text-6xl leading-[.88] sm:text-8xl lg:text-9xl">Psychic<br /><span className="text-primary">Sleuth</span></h1>
            <p className="mt-5 max-w-lg font-display text-lg italic text-foreground/75 sm:text-xl">The truth always moves before the lie is spoken.</p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Button className="h-12 px-6 text-base" onClick={enter}><Play /> Enter Case {activeCase.code}</Button>
              <Button variant="outline" className="h-12 px-6" onClick={() => onChooseCase(cases.find((item) => item.code !== activeCase.code)?.code ?? activeCase.code)}><Files /> View next case</Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-[10px] uppercase tracking-[.16em] text-muted-foreground">
              <span>Episode {activeCase.code}</span><span>{activeCase.title}</span><span>{activeCase.scene.stamp}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}