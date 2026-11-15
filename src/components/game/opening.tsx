import { Eye, FastForward, Files, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [phase, setPhase] = useState<"intro" | "credits" | "title">("intro");
  const [titleReady, setTitleReady] = useState(false);
  const [showCases, setShowCases] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const caseImages = useMemo(() => cases.flatMap((item) => [item.scene.image, ...item.suspectIds.map((id) => item.suspects[id]?.image).filter((image): image is string => Boolean(image))]), [cases]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleReady(true); setPhase("title");
      return;
    }
    const timers = [window.setTimeout(() => setBeat(1), 4000), window.setTimeout(() => setBeat(2), 8000), window.setTimeout(() => setPhase("credits"), 12000), window.setTimeout(() => { setTitleReady(true); setPhase("title"); }, 28000)];
    return () => timers.forEach(window.clearTimeout);
  }, [replay]);

  const silence = () => { audioRef.current?.pause(); setPlaying(false); };
  const skip = () => { setTitleReady(true); setPhase("title"); silence(); };
  const startTheme = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try { audio.currentTime = 0; await audio.play(); setPlaying(true); setAudioError(""); }
    catch { setAudioError("Sound could not start. Tap sound to try again."); setPlaying(false); }
  };
  const replayOpening = () => { setBeat(0); setPhase("intro"); setTitleReady(false); setShowCases(false); setReplay((value) => value + 1); void startTheme(); };
  const enter = () => {
    silence();
    sessionStorage.setItem("psychic-opening-seen", "true");
    onEnter();
  };
  const credits = [{ role: "Consulting investigator", name: "Patrick Jane" }, { role: "Case liaison", name: "Teresa Lisbon" }, ...cases.map((item) => ({ role: `Episode ${item.code}`, name: item.title })), { role: "Original score", name: "The Moment Before the Lie" }, { role: "Lead detective", name: "You" }];

  return (
    <main className="opening-stage fixed inset-0 z-[100] overflow-hidden bg-background text-foreground" aria-label="Psychic Sleuth opening">
      <audio ref={audioRef} src="/audio/psychic-sleuth-theme.mp3" preload="auto" onEnded={() => setPlaying(false)} />
      <div className="absolute inset-0">
        {caseImages.slice(0, 6).map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            className={`opening-frame absolute inset-0 h-full w-full object-cover ${index === (phase === "credits" ? 3 : beat) ? "opening-frame-active" : ""}`}
            width={1280}
            height={720}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="opening-shutter absolute inset-0" />
      </div>

      <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => playing ? silence() : replayOpening()} aria-label={playing ? "Mute opening theme" : "Play opening with sound"}>{playing ? <Volume2 /> : <VolumeX />} {playing ? "Sound on" : "Play with sound"}</Button>
      </div>
      {audioError && <p role="alert" className="absolute left-4 top-16 z-20 text-xs text-foreground">{audioError}</p>}
      {!titleReady ? (
        <>
          <Button variant="ghost" size="sm" className="absolute right-4 top-4 z-20" onClick={skip}>
            <FastForward /> Skip opening
          </Button>
          {phase === "credits" ? <div className="opening-roll-window absolute inset-x-0 bottom-12 top-24 z-10 overflow-hidden px-6 text-center" aria-label="Opening credits roll"><div className="opening-roll"><p className="mb-10 font-display text-4xl text-primary sm:text-6xl">Psychic Sleuth</p>{credits.map((credit) => <div key={credit.role} className="mb-10"><p className="text-[10px] font-bold uppercase text-primary">{credit.role}</p><p className="mx-auto mt-2 max-w-lg font-display text-2xl sm:text-3xl">{credit.name}</p></div>)}<p className="text-xs text-muted-foreground">An original interactive mystery</p></div></div> : <div className="relative z-10 flex h-full items-center px-6 sm:px-12 lg:px-24">
            <div key={beat} className="opening-credit max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-primary">{beats[beat]?.overline}</p>
              <p className="mt-2 font-display text-5xl leading-none sm:text-7xl">{beats[beat]?.title}</p>
              <p className="mt-4 max-w-md text-sm leading-6 text-foreground/70 sm:text-base">{beats[beat]?.detail}</p>
            </div>
          </div>}
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
              <Button variant="outline" className="h-12 px-6" onClick={() => setShowCases((value) => !value)}><Files /> Case files</Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={replayOpening}><RotateCcw /> Replay opening</Button>
            {showCases && <div className="mt-3 grid max-w-xl gap-2 sm:grid-cols-2">{cases.map((item) => <Button key={item.code} variant={item.code === activeCase.code ? "secondary" : "outline"} className="h-auto justify-start px-3 py-2 text-left" onClick={() => { silence(); if (item.code === activeCase.code) enter(); else onChooseCase(item.code); }}><span><span className="block text-[9px] uppercase tracking-[.16em] text-primary">Case {item.code}</span><span className="block text-xs">{item.title}</span></span></Button>)}</div>}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-[10px] uppercase tracking-[.16em] text-muted-foreground">
              <span>Episode {activeCase.code}</span><span>{activeCase.title}</span><span>{activeCase.scene.stamp}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}