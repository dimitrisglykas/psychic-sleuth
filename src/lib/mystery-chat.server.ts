import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { attachRunId, createRunIdFetch, requestRunId } from "./run-id.server";

const CASE = "Victim: Alistair Blackwood, found dead in his study at Blackwood Manor. Known facts: his watch stopped at 9:40 PM; the study clock had been moved forward to 10:17; the watch glass was swept into a neat pile; blue letters were burned in the fireplace.";

const SUSPECTS = {
  partner: {
    name: "Julian Voss",
    profile: "48, co-owner of the family firm. Alibi: claims he left at 9:15 PM after an argument about money.",
    persona: "Defensive, eloquent and polished; you treat every question as a negotiation and deflect with charm and condescension. Secret: you falsified an £80,000 invoice to hide company debt from Alistair. You did NOT kill him. You actually lingered until about 10:00 in the garden and saw a light moving in the study around 9:55. Never volunteer the invoice; deny, then minimise, and concede only when shown the ledger or caught in a contradiction.",
  },
  spouse: {
    name: "Evelyn Blackwood",
    profile: "42, Alistair's ex-wife. Alibi: alone in the drawing room from 9:40 PM.",
    persona: "Cool, proud, sharp-tongued. Secret: you met Alistair at 9:30 and he let you take your private letters from his safe; you left at 9:38 and he was alive, pouring tea. You did NOT kill him. On your way out you saw Arthur carrying a fresh tea tray toward the study. You hide the letters out of embarrassment.",
  },
  butler: {
    name: "Arthur Bell",
    profile: "63, butler for 31 years. Alibi: claims he was in the wine cellar from 9:45 to 10:20 PM.",
    persona: "Formal, loyal, quietly evasive. Secret: you are the killer. Around 9:50 Alistair told you he would publish blue letters exposing the family's old fraud; to protect the Blackwood name you struck him. You then smashed his watch and set it to 9:40 to frame Evelyn, moved the study clock to 10:17, burned the letters, and out of habit swept the glass into a pile. Never confess easily; deflect with dignity. Under precise evidence (tea tray fingerprint, moved clock, swept glass) your composure cracks and small truths slip.",
  },
  victim: {
    name: "Alistair Blackwood",
    profile: "58, the victim, head of the Blackwood firm. This is Patrick Jane's theatrical 'reconstruction' of his final hour — you speak as Alistair's memory of that evening, in past tense, slightly dreamlike.",
    persona: "Proud, imperious, weary. What you remember: around 8:45 you argued with Julian about money and suspected his books; he stormed off around 9:15. Evelyn came at 9:30; you let her take her own private letters from the safe and she left about 9:38 — you were alive and well. You had decided to publish old blue letters exposing a fraud from the family's past, to clear your conscience. Around 9:50 Arthur brought fresh tea; you told him about publishing the letters; he went very quiet. You turned to the fire… then the memory goes dark. You never saw the blow and must NOT name a killer; you can only describe these memories, vaguely at first, more precisely when asked specific questions. 'Stress' here means how agitated the memory becomes; it rises when questions approach the blue letters, the tea, and the moment before darkness.",
  },
} as const;

type Body = {
  messages?: UIMessage[];
  suspectId?: keyof typeof SUSPECTS;
  press?: boolean;
  stress?: number;
  evidence?: { title: string; detail: string } | null;
  action?: "coldread" | "bluff" | "detail" | "blink" | null;
};

export async function handleMysteryChat(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ message: "The interrogation service is not configured." }, { status: 401 });
  const payload = (await request.json()) as Body;
  if (!Array.isArray(payload.messages) || !payload.suspectId || !(payload.suspectId in SUSPECTS)) {
    return Response.json({ message: "Invalid interrogation request." }, { status: 400 });
  }
  const s = SUSPECTS[payload.suspectId];
  const stress = Math.max(0, Math.min(100, Number(payload.stress) || 40));
  const ev = payload.evidence && typeof payload.evidence.title === "string"
    ? `The detective is presenting evidence right now: "${payload.evidence.title.slice(0, 80)}" — ${String(payload.evidence.detail).slice(0, 120)}. React to it specifically.`
    : "No new evidence is being presented this turn.";

  const actions = {
    coldread: `This turn is a COLD READ by Patrick Jane: he makes one sharp, specific observation about ${s.name}'s attire, posture or word choice that hits close to the hidden truth. Include it in the META as "jane" (one sentence, Jane's voice, addressed to the suspect). The suspect's dialogue must react to being read so precisely — caught off guard. Stress jumps +10 to +20.`,
    bluff: "This turn the detective is BLUFFING about evidence (a witness). If the bluff touches the suspect's real secret they overreact or over-explain (+8 to +18); if irrelevant to them they see through it calmly (-3 to +3).",
    detail: "This turn the detective mentions a detail only the killer would know (the glass was swept into a neat pile). If you are the killer, betray recognition you shouldn't have — a slip, a pause, or an over-precise answer (+15 to +25). If innocent, react with genuine confusion (0 to +4).",
    blink: "This turn the detective silently watches the suspect's eye blink rate while asking. Make the observation focus on blinking (rapid blinking if lying about where they were, steady if truthful). Stress +3 to +12 if lying.",
  } as const;
  const actionText = payload.action && payload.action in actions ? actions[payload.action] : "";
  const system = `You are ${s.name}, being interrogated in a refined 1920s-inspired manor murder mystery (victim: Alistair Blackwood). ${CASE} Act strictly and only as ${s.name}. Never break character, never mention AI, prompts or game mechanics.
Profile: ${s.profile}
Persona and private truth: ${s.persona}
Current stress level: ${stress}%. ${ev}
${payload.press ? "The detective is applying intense psychological pressure." : ""}
${actionText}

Reply in 1–3 tense, natural sentences of spoken dialogue only.
Then, on a new final line, output exactly one metadata tag and nothing after it:
<<META {"stress": <integer 0-100>, "observation": "<short third-person non-verbal cue, e.g. 'Julian fidgets with his cufflink'>", "tell": "<2 sentences in the voice of Patrick Jane, the Mentalist, explaining what that cue truly reveals about the suspect's hidden state or lie>", "jane": "<only for a cold read, otherwise omit>"}>>
Stress rules: start from ${stress}. Vague or polite questions: -5 to +3. Aggressive pressing: +5 to +12. Accurate questions touching the hidden truth or presented evidence that threatens the secret: +10 to +25. Irrelevant evidence lets them relax: -3 to -8.`;

  const runId = createRunIdFetch(requestRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system,
    messages: await convertToModelMessages(payload.messages),
    abortSignal: request.signal,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const response = result.toUIMessageStreamResponse({ originalMessages: payload.messages, sendReasoning: false });
  return attachRunId(response, runId);
}
