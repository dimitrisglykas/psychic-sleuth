import { ArrowRight, Eye, FastForward, Files, Play, Search, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseData } from "@/game/case";
import { Attribution } from "./attribution";
import { LanguageSwitcher, useLanguage } from "./language";
import { translate } from "@/game/language";

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
  const [phase, setPhase] = useState<"intro" | "credits" | "title">("title");
  const [titleReady, setTitleReady] = useState(true);
  const [inspecting, setInspecting] = useState(false);
  const language = useLanguage();
  const t = (text: string) => translate(text, language);
  const firstClue = activeCase.clues.find((clue) => clue.id === activeCase.guide.clue);
  const [showCases, setShowCases] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const caseImages = useMemo(() => cases.flatMap((item) => [item.scene.image, ...item.suspectIds.map((id) => item.suspects[id]?.image).filter((image): image is string => Boolean(image))]), [cases]);

  useEffect(() => {
    if (replay === 0) return;
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
    <main className="opening-stage relative min-h-[100dvh] w-full overflow-hidden bg-background text-foreground" aria-label="Psychic Sleuth opening">
      <audio ref={audioRef} src="/audio/psychic-sleuth-theme.mp3" preload="auto" onEnded={() => setPlaying(false)} />
      <div className="absolute inset-0">
        {caseImages.slice(0, 6).map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            className={`opening-frame absolute inset-0 h-full w-full object-cover ${!titleReady && index === (phase === "credits" ? 3 : beat) ? "opening-frame-active" : ""}`}
            width={1280}
            height={720}
          />
        ))}
        {titleReady && <img src={activeCase.scene.image} alt={activeCase.scene.alt} className="absolute inset-0 h-full w-full object-cover" width={1920} height={1280} />}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="opening-shutter absolute inset-0" />
      </div>

      <div className={`relative z-20 mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 p-4 ${titleReady ? "hidden" : ""}`}>
        <Button variant="outline" size="sm" onClick={() => playing ? silence() : replayOpening()} aria-label={playing ? "Mute opening theme" : "Play opening with sound"}>{playing ? <Volume2 /> : <VolumeX />} {playing ? "Sound on" : "Play with sound"}</Button>
        <Button variant="ghost" size="sm" onClick={skip}><FastForward /> Skip opening</Button>
      </div>
      {audioError && <p role="alert" className="absolute left-4 top-16 z-20 text-xs text-foreground">{audioError}</p>}
      {!titleReady ? (
        <>
          {phase === "credits" ? <div className="opening-roll-window relative z-10 h-[75dvh] overflow-hidden px-6 text-center" aria-label="Opening credits roll"><div className="opening-roll"><p className="mb-10 font-display text-4xl text-primary sm:text-6xl">Psychic Sleuth</p>{credits.map((credit) => <div key={credit.role} className="mb-10"><p className="text-[10px] font-bold uppercase text-primary">{credit.role}</p><p className="mx-auto mt-2 max-w-lg font-display text-2xl sm:text-3xl">{credit.name}</p></div>)}<p className="text-xs text-muted-foreground">An original interactive mystery</p></div></div> : <div className="relative z-10 flex min-h-[75dvh] items-center px-6 py-8 sm:px-12 lg:px-24">
            <div key={beat} className="opening-credit max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-primary">{beats[beat]?.overline}</p>
              <p className="mt-2 font-display text-5xl leading-none sm:text-7xl">{beats[beat]?.title}</p>
              <p className="mt-4 max-w-md text-sm leading-6 text-foreground/70 sm:text-base">{beats[beat]?.detail}</p>
            </div>
          </div>}
          <p className="absolute bottom-6 left-6 z-10 text-[9px] font-bold uppercase tracking-[.24em] text-foreground/55 sm:left-12">An original interactive mystery</p>
        </>
      ) : (
        <div className="landing-title relative z-10 flex min-h-dvh flex-col">
          <header className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 px-4 py-4 sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-2"><Eye className="size-5 shrink-0 text-primary" /><span className="min-w-0 font-display text-lg">Psychic Sleuth</span></div><LanguageSwitcher /></header>
          <section className="mx-auto flex min-w-0 w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase text-primary"><span className="h-px w-8 bg-primary" />{t("An original mystery series")}</p>
            <h1 className="mt-3 font-display text-6xl leading-[.95] sm:text-8xl">Psychic <span className="text-primary">Sleuth</span></h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-foreground/85 sm:text-base">{t("Read the scene. Question the suspects. Catch the lie that solves the murder.")}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Button className="h-12 px-5 text-sm" onClick={enter}><ArrowRight />{t("Start Investigation")}</Button><Button variant="outline" className="h-12 bg-background/40" onClick={() => setShowCases((value) => !value)}><Files />{t("Case files")}</Button></div>
            {showCases && <div className="mt-4 grid max-w-xl gap-2 sm:grid-cols-2">{cases.map((item) => <Button key={item.code} variant={item.code === activeCase.code ? "secondary" : "outline"} className="h-auto justify-start whitespace-normal px-3 py-3 text-left" onClick={() => { silence(); if (item.code === activeCase.code) enter(); else onChooseCase(item.code); }}><span><span className="block text-[10px] text-primary">{t("Case")} {item.code}</span><span className="block text-xs">{t(item.title)}</span></span></Button>)}</div>}
            <div className="mt-8 max-w-xl border-t border-primary/40 pt-5 sm:mt-12">
              <p className="text-[10px] uppercase text-primary">{t("Case")} {activeCase.code} · {t("Your first clue")}</p>
              <h2 className="mt-1 font-display text-xl sm:text-2xl">{t(activeCase.title)}</h2>
              <p className="mt-1 text-xs leading-5 text-foreground/75">{t(activeCase.tagline)}</p>
              {firstClue && <article className="mt-4 grid min-w-0 grid-cols-1 overflow-hidden rounded-sm border border-border/80 bg-panel/90 backdrop-blur sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className={`evidence-slot-${firstClue.visualSlot} relative aspect-video overflow-hidden bg-muted sm:aspect-auto`}><img src={activeCase.scene.evidenceImage} alt={t(firstClue.title)} className="evidence-sheet max-w-none" width={1600} height={1008} /></div>
                <div className="min-w-0 flex-1 p-3 sm:p-4"><p className="font-display text-lg">{t(firstClue.title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t(firstClue.detail).replace(/\*\*/g, "")}</p><Button size="sm" variant="ghost" className="mt-2 h-8 px-0 text-primary" onClick={() => setInspecting(true)}><Search />{t("Inspect")}</Button></div>
              </article>}
            </div>
            <Button variant="ghost" size="sm" className="mt-4 w-fit px-0 text-xs text-muted-foreground" onClick={replayOpening}><Play className="size-3" />{t("Watch opening")}</Button>
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-background/70 px-5 py-4 sm:px-10"><span className="text-[10px] text-muted-foreground">Psychic Sleuth · {t("An original interactive mystery")}</span><Attribution /></footer>
          {inspecting && firstClue && <div className="fixed inset-0 z-[150] overflow-y-auto bg-background/95 p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={t(firstClue.title)}><div className="mx-auto w-full min-w-0 max-w-xl"><div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="font-display text-2xl">{t(firstClue.title)}</h2><Button size="icon" variant="outline" aria-label={t("Close")} onClick={() => setInspecting(false)}><X /></Button></div><div className={`evidence-slot-${firstClue.visualSlot} relative aspect-[4/3] overflow-hidden rounded-sm border`}><img src={activeCase.scene.evidenceImage} alt={t(firstClue.title)} className="evidence-sheet evidence-sheet-large max-w-none" width={1600} height={1008} /></div><p className="mt-4 text-sm leading-6">{t(firstClue.detail).replace(/\*\*/g, "")}</p><Button className="mt-5 w-full" onClick={enter}><ArrowRight />{t("Start Investigation")}</Button></div></div>}
        </div>
      )}
    </main>
  );
}