import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, isLanguage, translate, type Language } from "@/game/language";

const LanguageContext = createContext<Language>("en");
export const useLanguage = () => useContext(LanguageContext);

export function LanguageGate({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [ready, setReady] = useState(false);
  const [choosing, setChoosing] = useState(true);
  useEffect(() => { const saved = localStorage.getItem("psychic-language"); if (isLanguage(saved)) { setLanguage(saved); setChoosing(false); } setReady(true); }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const choose = (value: Language) => { setLanguage(value); localStorage.setItem("psychic-language", value); setChoosing(false); };
  if (!ready || choosing) return <main className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-y-auto bg-background px-6 py-10 text-foreground"><Globe className="mb-4 size-8 text-primary" /><h1 className="font-display text-4xl">Psychic Sleuth</h1><p className="mb-8 mt-3 text-center text-sm text-muted-foreground">Choose your language · Διάλεξε γλώσσα<br />Elige tu idioma · Choisissez votre langue</p><div className="grid w-full max-w-sm gap-3">{Object.entries(LANGUAGES).map(([code, label]) => <Button key={code} variant="outline" className="h-14 justify-start text-lg" onClick={() => { if (isLanguage(code)) choose(code); }} lang={code}>{label}</Button>)}</div></main>;
  return <LanguageContext.Provider value={language}><LocalizedSurface key={language} language={language}>{children}</LocalizedSurface><Button variant="outline" size="icon" className="fixed right-3 bottom-20 z-[110] size-9 bg-panel" onClick={() => setChoosing(true)} aria-label={translate("Language", language)} title={LANGUAGES[language]}><Globe className="size-4" /></Button></LanguageContext.Provider>;
}

// Covers all shared screens, including overlays and restored dialogue, while
// leaving React's canonical case data, player drafts, and saved outcomes intact.
function LocalizedSurface({ language, children }: { language: Language; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current; if (!element) return;
    const sources = new WeakMap<Text, { source: string; rendered: string }>();
    const attrs = new WeakMap<Element, Map<string, { source: string; rendered: string }>>();
    const update = () => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!(node instanceof Text) || node.parentElement?.closest("script, style, textarea, [data-player-authored]")) continue;
        const prior = sources.get(node);
        const source = prior && node.data === prior.rendered ? prior.source : node.data;
        const rendered = translate(source, language);
        sources.set(node, { source, rendered }); if (node.data !== rendered) node.data = rendered;
      }
      for (const item of element.querySelectorAll("[placeholder], [aria-label], [title], img[alt]")) {
        const saved = attrs.get(item) ?? new Map(); attrs.set(item, saved);
        for (const name of ["placeholder", "aria-label", "title", "alt"]) {
          const current = item.getAttribute(name); if (!current) continue;
          const prior = saved.get(name); const source = prior && current === prior.rendered ? prior.source : current;
          const rendered = translate(source, language); saved.set(name, { source, rendered });
          if (current !== rendered) item.setAttribute(name, rendered);
        }
      }
    };
    update(); const observer = new MutationObserver(update); observer.observe(element, { subtree: true, childList: true, characterData: true });
    return () => { observer.disconnect(); };
  }, [language]);
  return <div ref={root} className="contents" lang={language}>{children}</div>;
}