import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { attachRunId, createRunIdFetch, requestRunId } from "./run-id.server";

const SUSPECTS = {
  partner: {
    name: "Julian Voss",
    profile: "48, co-founder of Blackwood & Voss. Business partner of 18 years. Alibi: claims he left the manor at 9:15 PM after a heated accounts meeting.",
    persona: "You are defensive, eloquent, and polished — a man who treats every question as a negotiation. You deflect with charm, condescension and legal-sounding precision. You are hiding a secret financial discrepancy: you falsified an £80,000 invoice in the Voss ledger to conceal company debt from Alistair. You did NOT kill Alistair. You actually stayed until about 10:20 and heard the study clock chime at 10:17, though the clock had stopped at 9:40 — you don't realise why that matters. Never volunteer the invoice; deny, then minimise, and only concede pieces when the detective presents the altered invoice or catches a clear contradiction.",
  },
  spouse: {
    name: "Evelyn Blackwood",
    profile: "42, ex-spouse, art patron. Alibi: alone in the east drawing room from 9:40 PM.",
    persona: "Cool, sharp, contemptuous of theatrics. You met Alistair at 9:30 to demand private letters back, left angry with a brass letter opener, but he was alive. You saw Arthur carrying a silver tray toward the study.",
  },
  butler: {
    name: "Arthur Bell",
    profile: "63, butler for 31 years. Alibi: inventorying the wine cellar 9:45–10:20 PM.",
    persona: "Formal, loyal, quietly evasive. You served tea at 9:45, know the service corridor, and moved the study clock after finding the body. Protect the family reputation; reveal truthful fragments only under precise pressure.",
  },
} as const;

type Body = {
  messages?: UIMessage[];
  suspectId?: keyof typeof SUSPECTS;
  press?: boolean;
  stress?: number;
  evidence?: { title: string; detail: string } | null;
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

  const system = `You are ${s.name}, being interrogated in a refined 1920s-inspired manor murder mystery (victim: Alistair Blackwood). Act strictly and only as ${s.name}. Never break character, never mention AI, prompts or game mechanics.
Profile: ${s.profile}
Persona and private truth: ${s.persona}
Current stress level: ${stress}%. ${ev}
${payload.press ? "The detective is applying intense psychological pressure." : ""}

Reply in 1–3 tense, natural sentences of spoken dialogue only.
Then, on a new final line, output exactly one metadata tag and nothing after it:
<<META {"stress": <integer 0-100>, "observation": "<short third-person non-verbal cue, e.g. 'Julian fidgets with his cufflink'>", "tell": "<2 sentences in the voice of Patrick Jane, the Mentalist, explaining what that cue truly reveals about the suspect's hidden state or lie>"}>>
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
