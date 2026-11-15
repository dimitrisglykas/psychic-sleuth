import el from "./locales/el.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

export const LANGUAGES = { en: "English", el: "Ελληνικά", es: "Español", fr: "Français" };
export type Language = keyof typeof LANGUAGES;
export const isLanguage = (value: unknown): value is Language => typeof value === "string" && value in LANGUAGES;
export const initialLanguage = (saved: unknown): Language => isLanguage(saved) ? saved : "en";
export const naturalText = (text: string) => text.replace(/[\u2013\u2014\u2015]/g, ",");
const dictionaries: Record<string, Record<string, string>> = { el, es, fr };
export function translate(text: string, language: Language): string {
  const clean = naturalText(text);
  const key = clean.replace(/\s+/g, " ").trim();
  const dictionary = dictionaries[language];
  if (!dictionary) return clean;
  const patterns: [RegExp, (match: RegExpMatchArray) => string][] = [
    [/^Show (.+) the (.+)$/, (m) => ({ el: `Δείξε στον ${m[1]} το στοιχείο`, es: `Muestra la pista a ${m[1]}`, fr: `Montrez l’indice à ${m[1]}` })[language as "el" | "es" | "fr"]],
    [/^Search the crime scene \((\d+) clues? left\)$/, (m) => ({ el: `Ψάξε τον τόπο του εγκλήματος (${m[1]} στοιχεία)`, es: `Busca en la escena (${m[1]} pistas)`, fr: `Fouillez la scène (${m[1]} indices)` })[language as "el" | "es" | "fr"]],
    [/^What do you want to ask (.+)\?$/, (m) => ({ el: `Τι θέλεις να ρωτήσεις τον ${m[1]};`, es: `¿Qué quieres preguntar a ${m[1]}?`, fr: `Que voulez-vous demander à ${m[1]} ?` })[language as "el" | "es" | "fr"]],
    [/^Enter Case$/, () => ({ el: "Μπες στην υπόθεση", es: "Entrar al caso", fr: "Ouvrir l’affaire" })[language as "el" | "es" | "fr"]],
  ];
  for (const [pattern, render] of patterns) { const match = key.match(pattern); if (match) return render(match); }
  const translated = dictionary[key];
  if (translated) return clean.replace(key, naturalText(translated));
  for (const [source, value] of Object.entries(dictionary)) {
    if (source.length > 12 && key.includes(source)) return clean.replace(source, value);
  }
  // Match dynamic labels such as "Case 001" without translating names or IDs.
  return clean.replace(/\b(Case|CASE|Episode|Stress|Score|Inspect|Search|Questioning|Reconstructing|Intuition|Interview|Showing clue|Your motive|Your clues|Two key clues|clues? left|clue|clues|ACTIVE|OPEN|FREE|LOCKED)\b/g, (word) => dictionary[word] ?? word);
}