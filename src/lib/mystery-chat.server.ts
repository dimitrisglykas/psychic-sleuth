import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { attachRunId, createRunIdFetch, requestRunId } from "./run-id.server";

type Body = {
  messages?: UIMessage[];
  suspectId?: string;
  caseCode?: string;
  press?: boolean;
  stress?: number;
  evidence?: { title: string; detail: string } | null;
  action?: "coldread" | "bluff" | "detail" | "blink" | null;
};

export async function handleMysteryChat(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ message: "The interrogation service is not configured." }, { status: 401 });
  const payload = (await request.json()) as Body;
  const caseCode = payload.caseCode === "002" ? "002" : "001";
  if (!Array.isArray(payload.messages) || typeof payload.suspectId !== "string") {
    return Response.json({ message: "Invalid interrogation request." }, { status: 400 });
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: s }, { data: file }] = await Promise.all([
    supabaseAdmin.from("case_people").select("name, profile, persona").eq("case_code", caseCode).eq("person_id", payload.suspectId).maybeSingle(),
    supabaseAdmin.from("case_files").select("setting, facts, trap_detail").eq("case_code", caseCode).maybeSingle(),
  ]);
  if (!s || !file) return Response.json({ message: "Unknown suspect for this case." }, { status: 404 });
  const stress = Math.max(0, Math.min(100, Number(payload.stress) || 40));
  const ev = payload.evidence && typeof payload.evidence.title === "string"
    ? `The detective is presenting evidence right now: "${payload.evidence.title.slice(0, 80)}" — ${String(payload.evidence.detail).slice(0, 120)}. React to it specifically.`
    : "No new evidence is being presented this turn.";

  const actions = {
    coldread: `This turn is a COLD READ by Patrick Jane: he makes one sharp, specific observation about ${s.name}'s attire, posture or word choice that hits close to the hidden truth. Include it in the META as "jane" (one sentence, Jane's voice, addressed to the suspect). The suspect's dialogue must react to being read so precisely — caught off guard. Stress jumps +10 to +20.`,
    bluff: "This turn the detective is BLUFFING about evidence (a witness). If the bluff touches the suspect's real secret they overreact or over-explain (+8 to +18); if irrelevant to them they see through it calmly (-3 to +3).",
    detail: "This turn the detective mentions a detail only the killer would know (${file.trap_detail}). If you are the killer, betray recognition you shouldn't have — a slip, a pause, or an over-precise answer (+15 to +25). If innocent, react with genuine confusion (0 to +4).",
    blink: "This turn the detective silently watches the suspect's eye blink rate while asking. Make the observation focus on blinking (rapid blinking if lying about where they were, steady if truthful). Stress +3 to +12 if lying.",
  } as const;
  const actionText = payload.action && payload.action in actions ? actions[payload.action] : "";
  const system = `You are ${s.name}, being interrogated in ${file.setting}. ${file.facts} Act strictly and only as ${s.name}. Never break character, never mention AI, prompts or game mechanics.
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
