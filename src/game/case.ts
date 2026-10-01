import { createContext, useContext } from "react";
import { BadgeCheck, Banknote, Cable, Clock, FileText, Fingerprint, Flame, Gem, GlassWater, LockKeyhole, Radio, ScrollText, Video, Watch, type LucideIcon } from "lucide-react";
import julianImage from "@/assets/julian-voss.jpg";
import evelynImage from "@/assets/evelyn-blackwood.jpg";
import arthurImage from "@/assets/arthur-bell.jpg";
import alistairImage from "@/assets/alistair-blackwood.jpg";
import studyImage from "@/assets/crime-scene-study.jpg";
import helenaImage from "@/assets/helena-marsh.jpg";
import victorImage from "@/assets/victor-crane.jpg";
import ninaImage from "@/assets/nina-reyes.jpg";
import marcusImage from "@/assets/marcus-hale.jpg";
import vaultImage from "@/assets/gala-vault.jpg";

export type SuspectId = string;
export type PersonId = string;
export type ClueId = string;
export type MotiveId = string;
export type Person = { name: string; short: string; role: string; age: number; image: string; stress: number; bio: string; alibi: string; motive: string; opener: string };
export type Clue = { id: ClueId; title: string; detail: string; prompt: string; icon: LucideIcon };

export type CaseData = {
  code: string; title: string; tagline: string; storageKey: string;
  suspectIds: SuspectId[]; suspects: Record<SuspectId, Person>; victim: Person; people: Record<PersonId, Person>;
  clues: Clue[]; startClues: ClueId[];
  scene: { image: string; label: string; alt: string };
  hotspots: { id: string; label: string; clue: ClueId; x: number; y: number }[];
  motives: { id: MotiveId; label: string }[];
  connections: { a: ClueId; b: ClueId; text: string }[];
  timeline: { time: string; text: string; claimed?: boolean }[];
  briefing: { time: string; lines: string[]; aside: string };
  guide: { suspect: SuspectId; clue: ClueId; label: string };
  ending: { lose: (short: string) => string };
};

const mk = (c: Omit<CaseData, "people" | "clueById">) => ({ ...c, people: { ...c.suspects, victim: c.victim } }) as CaseData;

export const case001 = mk({
  code: "001", title: "The Enigma at Blackwood Manor", tagline: "A wealthy businessman, a locked study, three liars.", storageKey: "blackwood",
  suspectIds: ["partner", "spouse", "butler"],
  suspects: {
    partner: { name: "Julian Voss", short: "Julian", role: "The Business Partner", age: 48, image: julianImage, stress: 45, bio: "Co-owns the family firm with Alistair. **Smooth talker**, hates being questioned.", alibi: "Says he **left at 9:15 PM** after an argument about money.", motive: "The company books don't add up — and **Alistair was about to check them**.", opener: "You wished to speak with me, detective? I've already given your constable my statement." },
    spouse: { name: "Evelyn Blackwood", short: "Evelyn", role: "The Ex-Spouse", age: 42, image: evelynImage, stress: 35, bio: "Divorced Alistair two years ago. **Proud and sharp-tongued.**", alibi: "Says she was **alone in the drawing room from 9:40 PM**.", motive: "Alistair kept **her private letters** locked in his safe.", opener: "If this is about Alistair, ask plainly. I have no appetite for theatrics tonight." },
    butler: { name: "Arthur Bell", short: "Arthur", role: "The Butler", age: 63, image: arthurImage, stress: 25, bio: "Served the family for **31 years**. Knows every room and hidden corridor.", alibi: "Says he was **in the wine cellar from 9:45 to 10:20 PM**.", motive: "Fiercely loyal to **the Blackwood family name**.", opener: "I am at your service. The household deserves clarity, however unpleasant it may be." },
  },
  victim: { name: "Alistair Blackwood", short: "Alistair", role: "The Victim · Reconstruction", age: 58, image: alistairImage, stress: 20, bio: "Head of the Blackwood firm. Jane **reconstructs his last hour** from what the room remembers.", alibi: "Found dead in his study. **Last seen alive around 9:50 PM.**", motive: "Planned to **make something public** the night he died.", opener: "(Jane closes his eyes.) …Tea. I'd rung for tea. Ask me about tonight, detective — my memory is all I have left." },
  clues: [
    { id: "watch", icon: Watch, title: "Broken Watch", detail: "Alistair's watch **stopped at 9:40 PM** — right after Evelyn's visit.", prompt: "Alistair's watch stopped at 9:40 PM. Where were you at that exact moment?" },
    { id: "invoice", icon: FileText, title: "Altered Ledger", detail: "An invoice for **£80,000** was changed in Julian's handwriting.", prompt: "The £80,000 invoice in the ledger was altered in your handwriting. What were you hiding?" },
    { id: "ash", icon: Flame, title: "Burned Blue Letters", detail: "Scraps of **blue paper** in the fire. One reads: \"…the Blackwood name…\"", prompt: "Someone burned blue letters in the fireplace mentioning the Blackwood name. What were they?" },
    { id: "print", icon: Fingerprint, title: "Print on Tea Tray", detail: "**Arthur's fingerprint** in fresh tea — made **after 9:45 PM**.", prompt: "Your fingerprint is on the tea tray, in tea poured after 9:45. How, if you were in the cellar?" },
    { id: "clock", icon: Clock, title: "Moved Study Clock", detail: "The mantel clock was **lifted and set forward to 10:17**. Dust gives it away.", prompt: "Someone moved the study clock forward to 10:17. Who would want to confuse the time?" },
    { id: "safe", icon: LockKeyhole, title: "Empty Letter Folder", detail: "The safe was opened with a key. **Evelyn's letters are gone.**", prompt: "Your letters are missing from Alistair's safe. Did you take them tonight?" },
    { id: "glass", icon: GlassWater, title: "Swept Watch Glass", detail: "The broken watch glass was **swept into a neat pile** — a servant's habit.", prompt: "The watch glass was swept into a tidy pile. Who in this house cleans up without thinking?" },
  ],
  startClues: ["watch", "invoice"],
  scene: { image: studyImage, label: "Alistair's study", alt: "Alistair Blackwood's study at night" },
  hotspots: [
    { id: "mantel", label: "Mantel clock", clue: "clock", x: 11, y: 15 },
    { id: "fireplace", label: "Fireplace", clue: "ash", x: 12, y: 52 },
    { id: "desk", label: "Desk", clue: "invoice", x: 50, y: 48 },
    { id: "tray", label: "Tea tray", clue: "print", x: 77, y: 49 },
    { id: "safe", label: "Wall safe", clue: "safe", x: 91, y: 30 },
    { id: "glass", label: "Broken glass", clue: "glass", x: 12, y: 85 },
  ],
  motives: [{ id: "fraud", label: "Hide the £80,000 fraud" }, { id: "letters", label: "Get back private letters" }, { id: "name", label: "Protect the Blackwood name" }, { id: "money", label: "Inherit the estate" }],
  connections: [
    { a: "print", b: "glass", text: "The tray print and the tidy glass share a habit — someone who **serves** and someone who **cleans up**. Same person?" },
    { a: "watch", b: "clock", text: "Two broken clocks, two different times. A real death only needs **one**. Someone was **staging the time**." },
    { a: "ash", b: "safe", text: "The safe gave up Evelyn's letters, but the fire ate **different ones — blue ones**. Who wanted those gone?" },
    { a: "invoice", b: "watch", text: "Julian's lie is about **money**, not time. A fraud hides in ledgers, not in **9:40**." },
  ],
  timeline: [
    { time: "9:15 PM", text: "Julian **says** he left the manor.", claimed: true },
    { time: "9:30 PM", text: "Evelyn meets Alistair in the study." },
    { time: "9:40 PM", text: "Alistair's watch **stops**." },
    { time: "9:45 PM", text: "Arthur **says** he went down to the cellar.", claimed: true },
    { time: "after 9:45", text: "Fresh tea poured — **Arthur's print** on the tray." },
    { time: "10:17 PM", text: "Study clock **set forward** to this time." },
    { time: "10:20 PM", text: "Arthur **says** he left the cellar.", claimed: true },
  ],
  briefing: { time: "11:42 PM", lines: ["Alistair Blackwood is dead in his study at Blackwood Manor. Local police are calling it a robbery gone wrong. I'm not buying it.", "Three people were in that house tonight. The case is yours — find me who did it, and why. And please, no stunts."], aside: "Jane sets down his tea. \"No stunts. Of course.\"" },
  guide: { suspect: "partner", clue: "invoice", label: "ledger" },
  ending: {
    lose: (s) => `"Ah. You chased the loudest secret in the room. ${s} is guilty of plenty — just not murder."`,
  },
});

export const case002 = mk({
  code: "002", title: "The Gala Heist", tagline: "A diamond vanishes at the museum gala. A guard lies dead by the vault.", storageKey: "gala",
  suspectIds: ["curator", "collector", "tech"],
  suspects: {
    curator: { name: "Dr. Helena Marsh", short: "Helena", role: "The Curator", age: 51, image: helenaImage, stress: 40, bio: "Runs the Aldridge Museum. **Brilliant, proud** — and the museum is quietly broke.", alibi: "Says she was **on stage hosting the auction, 10:00–10:30 PM**.", motive: "The Lisbon Star is **insured for £12 million**.", opener: "Detective. Tonight was meant to save this museum. Please be quick — I have donors to calm." },
    collector: { name: "Victor Crane", short: "Victor", role: "The Collector", age: 60, image: victorImage, stress: 30, bio: "Billionaire donor. **Has wanted the Lisbon Star for twenty years.**", alibi: "Says he was **at the bar the entire auction**.", motive: "The museum **refused to sell** him the diamond.", opener: "Ah, the famous consultant. Do sit. I assume you'd like me to confess to something dramatic?" },
    tech: { name: "Nina Reyes", short: "Nina", role: "The Security Tech", age: 34, image: ninaImage, stress: 35, bio: "Installed the museum's **new camera system** last month. Has admin access.", alibi: "Says she was **in the basement server room, 10:00–10:30**, fixing a fault.", motive: "Contractor's pay, **expensive tastes** — and nobody watches the watchers.", opener: "I've already sent your people the system logs. Not sure what else I can tell you." },
  },
  victim: { name: "Marcus Hale", short: "Marcus", role: "The Victim · Reconstruction", age: 45, image: marcusImage, stress: 20, bio: "Night guard, 12 years at the museum. Jane **reconstructs his last half hour**.", alibi: "Found dead by the vault gallery. **Last radio call at 10:14 PM.**", motive: "Needed money for **his daughter's surgery**.", opener: "(Jane closes his eyes.) …The screens hummed. Upstairs, the auction. Ask me about my last rounds, detective." },
  clues: [
    { id: "gap", icon: Video, title: "Camera Loop", detail: "The vault camera **replayed old footage from 10:12 to 10:16 PM**. Needs admin access.", prompt: "The vault camera was looped from 10:12 to 10:16. Who could do that, and where were you?" },
    { id: "bribe", icon: Banknote, title: "Envelope Marked V.C.", detail: "**£20,000 in cash** in Marcus's locker, envelope initialled **\"V.C.\"**", prompt: "There was £20,000 in Marcus's locker in an envelope marked V.C. What was it for?" },
    { id: "paste", icon: Gem, title: "Paste Fragment", detail: "A chip from the case is **glass, not diamond**. The Lisbon Star on display was a **replica**.", prompt: "The stone in the case was a paste replica. When did the real Lisbon Star disappear?" },
    { id: "badge", icon: BadgeCheck, title: "Keycard Log", detail: "The vault door opened at **10:13 PM** with contractor card **TECH-02**.", prompt: "The vault door opened at 10:13 with contractor keycard TECH-02. Whose card is that?" },
    { id: "radio", icon: Radio, title: "Marcus's Last Call", detail: "10:14 PM radio: **\"Oh, it's you — thought you'd fixed it.\"** He knew his killer.", prompt: "Marcus's last words on the radio were 'Oh, it's you — thought you'd fixed it.' Who was he talking to?" },
    { id: "tie", icon: Cable, title: "Clipped Cable Tie", detail: "A **black cable tie snipped** at the camera junction box — installer's kit.", prompt: "A cable tie was clipped at the camera junction box. Who carries those and the cutters?" },
    { id: "claim", icon: ScrollText, title: "Insurance Draft", detail: "A claim for **£12 million**, typed on Helena's computer **at 10:40 PM** — before police arrived.", prompt: "You drafted a £12 million insurance claim before the police even arrived. Why so fast?" },
  ],
  startClues: ["gap", "bribe"],
  scene: { image: vaultImage, label: "The vault gallery", alt: "The Aldridge Museum vault gallery after the gala" },
  hotspots: [
    { id: "junction", label: "Junction box", clue: "tie", x: 20, y: 8 },
    { id: "office", label: "Curator's office", clue: "claim", x: 8, y: 44 },
    { id: "case", label: "Display case", clue: "paste", x: 44, y: 46 },
    { id: "reader", label: "Keycard reader", clue: "badge", x: 78, y: 37 },
    { id: "radio", label: "Guard's radio", clue: "radio", x: 86, y: 86 },
  ],
  motives: [{ id: "debt", label: "Pay off dangerous debts" }, { id: "cover", label: "Hide that the diamond was fake" }, { id: "own", label: "Finally own the Lisbon Star" }, { id: "silence", label: "Silence a guard taking bribes" }],
  connections: [
    { a: "gap", b: "tie", text: "A loop needs **admin access** and a **hand in the junction box**. Only one person here had both." },
    { a: "badge", b: "radio", text: "The door opened at **10:13**, Marcus spoke at **10:14** — to someone he **expected to see near the cameras**." },
    { a: "paste", b: "claim", text: "A curator filing for **£12 million** on a **fake stone**? Fraud, certainly. Murder needs more than paperwork." },
    { a: "bribe", b: "gap", text: "Victor paid to **look**, not to loop. Bribes buy doors opened — not **cameras rewired**." },
  ],
  timeline: [
    { time: "9:45 PM", text: "Victor's **private viewing** of the diamond with Marcus." },
    { time: "10:00 PM", text: "Auction begins upstairs. Helena **says** she's on stage throughout.", claimed: true },
    { time: "10:00 PM", text: "Nina **says** she's in the server room.", claimed: true },
    { time: "10:12 PM", text: "Vault camera starts **replaying a loop**." },
    { time: "10:13 PM", text: "Vault door opened with card **TECH-02**." },
    { time: "10:14 PM", text: "Marcus radios: **\"Oh, it's you.\"**" },
    { time: "10:40 PM", text: "Insurance claim typed on Helena's computer." },
  ],
  briefing: { time: "11:58 PM", lines: ["Gala at the Aldridge Museum. The Lisbon Star is gone and the night guard, Marcus Hale, is dead by the vault.", "Three people had the access and the reasons. Find the thief — and the killer. Try not to insult any billionaires."], aside: "Jane straightens his waistcoat. \"I'll insult them politely.\"" },
  guide: { suspect: "collector", clue: "bribe", label: "envelope" },
  ending: {
    lose: (s) => `"Close — but ${s} only stole money, or truth, or time. Someone else stole a life."`,
  },
});

export const CASES: Record<string, CaseData> = { "001": case001, "002": case002 };
export const lockedCases = [{ code: "003", title: "Red Lantern Wharf", teaser: "A shipping heir drowns in three feet of water. Nobody saw a thing." }];

export const janeQuotes = [
  "\"Tea is the most underrated tool of detection. Nobody lies well to a man holding a teacup.\"",
  "\"I'm not psychic. I just pay attention. Let the room talk for a minute.\"",
  "\"The trick is to stop looking for the answer and start looking at the people.\"",
  "\"Everyone's guilty of something. The question is — of what?\"",
];

export const CaseContext = createContext<CaseData>(case001);
export const useCase = () => useContext(CaseContext);
export const clueOf = (c: CaseData, id: ClueId) => c.clues.find((x) => x.id === id)!;
