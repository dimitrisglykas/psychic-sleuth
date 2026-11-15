import el from "./locales/el.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

export const LANGUAGES = { en: "English", el: "Ελληνικά", es: "Español", fr: "Français" };
export type Language = keyof typeof LANGUAGES;
export const isLanguage = (value: unknown): value is Language => typeof value === "string" && value in LANGUAGES;
export const naturalText = (text: string) => text.replace(/[\u2013\u2014\u2015]/g, ",");
const dictionaries: Record<string, Record<string, string>> = { el, es, fr };
export function translate(text: string, language: Language): string {
  const clean = naturalText(text);
  const key = clean.replace(/\s+/g, " ").trim();
  const dictionary = dictionaries[language];
  if (!dictionary) return clean;
  const translated = dictionary[key];
  if (translated) return clean.replace(key, naturalText(translated));
  for (const [source, value] of Object.entries(dictionary)) {
    if (source.length > 12 && key.includes(source)) return clean.replace(source, value);
  }
  // Match dynamic labels such as "Case 001" without translating names or IDs.
  return clean.replace(/\b(Case|CASE|Episode|Stress|Score|Inspect|Search|Questioning|Reconstructing|Intuition|Interview|Showing clue|Your motive|Your clues|Two key clues|clues? left|clue|clues|ACTIVE|OPEN|FREE|LOCKED)\b/g, (word) => dictionary[word] ?? word);
}