import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LANGUAGES, initialLanguage, isLanguage, translate, type Language } from "@/game/language";

const LanguageContext = createContext<Language>("en");
const LanguageSetterContext = createContext<(value: string) => void>(() => {});
export const useLanguage = () => useContext(LanguageContext);

export function LanguageGate({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => { setLanguage(initialLanguage(localStorage.getItem("psychic-language"))); }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const choose = (value: string) => { if (!isLanguage(value)) return; setLanguage(value); localStorage.setItem("psychic-language", value); };
  return <LanguageContext.Provider value={language}><LanguageSetterContext.Provider value={choose}><LocalizedSurface language={language}>{children}</LocalizedSurface></LanguageSetterContext.Provider></LanguageContext.Provider>;
}

export function LanguageSwitcher() {
  const language = useLanguage(); const choose = useContext(LanguageSetterContext);
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-11 shrink-0 gap-2 rounded-full bg-panel/95 px-3 backdrop-blur" aria-label={translate("Language", language)}><Globe className="size-3.5 text-primary" /><span lang={language}>{LANGUAGES[language]}</span><ChevronDown className="size-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="z-[170] min-w-40"><DropdownMenuRadioGroup value={language} onValueChange={choose}>{Object.entries(LANGUAGES).map(([code, label]) => <DropdownMenuRadioItem key={code} value={code} lang={code} className="py-3">{label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>;
}

// Covers all shared screens, including overlays and restored dialogue, while
// leaving React's canonical case data, player drafts, and saved outcomes intact.
function LocalizedSurface({ language, children }: { language: Language; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const sourceTexts = useRef(new WeakMap<Text, { source: string; rendered: string }>());
  const sourceAttrs = useRef(new WeakMap<Element, Map<string, { source: string; rendered: string }>>());
  useEffect(() => {
    const element = root.current; if (!element) return;
    const sources = sourceTexts.current;
    const attrs = sourceAttrs.current;
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