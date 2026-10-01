import { Clock, FileText, Fingerprint, Flame, GlassWater, LockKeyhole, Watch, type LucideIcon } from "lucide-react";
import julianImage from "@/assets/julian-voss.jpg";
import evelynImage from "@/assets/evelyn-blackwood.jpg";
import arthurImage from "@/assets/arthur-bell.jpg";

export type SuspectId = "partner" | "spouse" | "butler";
export const SUSPECT_IDS: SuspectId[] = ["partner", "spouse", "butler"];

export const suspects: Record<SuspectId, {
  name: string; short: string; role: string; age: number; image: string; stress: number;
  bio: string; alibi: string; motive: string; opener: string;
}> = {
  partner: {
    name: "Julian Voss", short: "Julian", role: "The Business Partner", age: 48, image: julianImage, stress: 45,
    bio: "Co-owns the family firm with Alistair. **Smooth talker**, hates being questioned.",
    alibi: "Says he **left at 9:15 PM** after an argument about money.",
    motive: "The company books don't add up — and **Alistair was about to check them**.",
    opener: "You wished to speak with me, detective? I've already given your constable my statement.",
  },
  spouse: {
    name: "Evelyn Blackwood", short: "Evelyn", role: "The Ex-Spouse", age: 42, image: evelynImage, stress: 35,
    bio: "Divorced Alistair two years ago. **Proud and sharp-tongued.**",
    alibi: "Says she was **alone in the drawing room from 9:40 PM**.",
    motive: "Alistair kept **her private letters** locked in his safe.",
    opener: "If this is about Alistair, ask plainly. I have no appetite for theatrics tonight.",
  },
  butler: {
    name: "Arthur Bell", short: "Arthur", role: "The Butler", age: 63, image: arthurImage, stress: 25,
    bio: "Served the family for **31 years**. Knows every room and hidden corridor.",
    alibi: "Says he was **in the wine cellar from 9:45 to 10:20 PM**.",
    motive: "Fiercely loyal to **the Blackwood family name**.",
    opener: "I am at your service. The household deserves clarity, however unpleasant it may be.",
  },
};

export type ClueId = "watch" | "invoice" | "ash" | "print" | "clock" | "safe" | "glass";
export type Clue = { id: ClueId; title: string; detail: string; prompt: string; icon: LucideIcon };

export const clues: Clue[] = [
  { id: "watch", icon: Watch, title: "Broken Watch", detail: "Alistair's watch **stopped at 9:40 PM** — right after Evelyn's visit.", prompt: "Alistair's watch stopped at 9:40 PM. Where were you at that exact moment?" },
  { id: "invoice", icon: FileText, title: "Altered Ledger", detail: "An invoice for **£80,000** was changed in Julian's handwriting.", prompt: "The £80,000 invoice in the ledger was altered in your handwriting. What were you hiding?" },
  { id: "ash", icon: Flame, title: "Burned Blue Letters", detail: "Scraps of **blue paper** in the fire. One reads: \"…the Blackwood name…\"", prompt: "Someone burned blue letters in the fireplace mentioning the Blackwood name. What were they?" },
  { id: "print", icon: Fingerprint, title: "Print on Tea Tray", detail: "**Arthur's fingerprint** in fresh tea — made **after 9:45 PM**.", prompt: "Your fingerprint is on the tea tray, in tea poured after 9:45. How, if you were in the cellar?" },
  { id: "clock", icon: Clock, title: "Moved Study Clock", detail: "The mantel clock was **lifted and set forward to 10:17**. Dust gives it away.", prompt: "Someone moved the study clock forward to 10:17. Who would want to confuse the time?" },
  { id: "safe", icon: LockKeyhole, title: "Empty Letter Folder", detail: "The safe was opened with a key. **Evelyn's letters are gone.**", prompt: "Your letters are missing from Alistair's safe. Did you take them tonight?" },
  { id: "glass", icon: GlassWater, title: "Swept Watch Glass", detail: "The broken watch glass was **swept into a neat pile** — a servant's habit.", prompt: "The watch glass was swept into a tidy pile. Who in this house cleans up without thinking?" },
];
export const clueById = (id: ClueId) => clues.find((c) => c.id === id)!;
export const START_CLUES: ClueId[] = ["watch", "invoice"];

export const hotspots: { id: string; label: string; clue: ClueId; x: number; y: number }[] = [
  { id: "mantel", label: "Mantel clock", clue: "clock", x: 11, y: 15 },
  { id: "fireplace", label: "Fireplace", clue: "ash", x: 12, y: 52 },
  { id: "desk", label: "Desk", clue: "invoice", x: 50, y: 48 },
  { id: "tray", label: "Tea tray", clue: "print", x: 77, y: 49 },
  { id: "safe", label: "Wall safe", clue: "safe", x: 91, y: 30 },
  { id: "glass", label: "Broken glass", clue: "glass", x: 12, y: 85 },
];

export const motives = [
  { id: "fraud", label: "Hide the £80,000 fraud" },
  { id: "letters", label: "Get back private letters" },
  { id: "name", label: "Protect the Blackwood name" },
  { id: "money", label: "Inherit the estate" },
] as const;
export type MotiveId = (typeof motives)[number]["id"];

export const solution = { culprit: "butler" as SuspectId, motive: "name" as MotiveId, clues: ["print", "clock", "glass"] as ClueId[] };

export const lockedCases = [
  { code: "002", title: "The Gala Heist", teaser: "A diamond vanishes at the museum gala. A guard lies dead by the vault." },
  { code: "003", title: "Red Lantern Wharf", teaser: "A shipping heir drowns in three feet of water. Nobody saw a thing." },
];
