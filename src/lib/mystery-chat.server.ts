import { GatewayError, streamResponse } from "@lovable.dev/ai-gateway";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { dialogueHistory } from "./chat-history";
import { isLanguage, naturalText } from "@/game/language";

type Body = {
  messages?: UIMessage[];
  suspectId?: string;
  caseCode?: string;
  language?: string;
  press?: boolean;
  stress?: number;
  evidence?: { title: string; detail: string } | null;
  action?: "coldread" | "bluff" | "detail" | "blink" | null;
};

export async function handleMysteryChat(request: Request) {
  const payload = (await request.json()) as Body;
  const language = isLanguage(payload.language) ? payload.language : "en";
  const languageName = { en: "English", el: "Greek", es: "Spanish", fr: "French" }[language];
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
    ? `The detective is presenting evidence right now: "${payload.evidence.title.slice(0, 80)}". ${String(payload.evidence.detail).slice(0, 120)}. React to it specifically.`
    : "No new evidence is being presented this turn.";

  const actions = {
    coldread: `This turn is a COLD READ by Patrick Jane: he makes one sharp, specific observation about ${s.name}'s attire, posture or word choice that hits close to the hidden truth. Include it in the META as "jane" (one sentence, Jane's voice, addressed to the suspect). The suspect's dialogue must react to being read so precisely and become caught off guard. Stress jumps +10 to +20.`,
    bluff: "This turn the detective is BLUFFING about evidence (a witness). If the bluff touches the suspect's real secret they overreact or over-explain (+8 to +18); if irrelevant to them they see through it calmly (-3 to +3).",
    detail: `This turn the detective mentions a detail only the killer would know (${file.trap_detail}). If you are the killer, betray recognition you should not have through a slip, a pause, or an over-precise answer (+15 to +25). If innocent, react with genuine confusion (0 to +4).`,
    blink: "This turn the detective silently watches the suspect's eye blink rate while asking. Make the observation focus on blinking (rapid blinking if lying about where they were, steady if truthful). Stress +3 to +12 if lying.",
  } as const;
  const actionText = payload.action && payload.action in actions ? actions[payload.action] : "";
  const system = `You are ${s.name}, being interrogated in ${file.setting}. ${file.facts} Act strictly and only as ${s.name}. Never break character, never mention AI, prompts or game mechanics.
Profile: ${s.profile}
Persona and private truth: ${s.persona}
Current stress level: ${stress}%. ${ev}
${payload.press ? "The detective is applying intense psychological pressure." : ""}
${actionText}

Reply in 1 to 3 tense, natural sentences of spoken dialogue only. Write ALL dialogue, observation, tell, and Jane's cold read in ${languageName}, regardless of the language used in prior messages or evidence. Keep metadata JSON keys in English. Never use an em dash or en dash anywhere, including metadata. Use commas or full stops instead.
Then, on a new final line, output exactly one metadata tag and nothing after it:
<<META {"stress": <integer 0-100>, "observation": "<short third-person non-verbal cue, e.g. 'Julian fidgets with his cufflink'>", "tell": "<2 sentences in the voice of Patrick Jane, the Mentalist, explaining what that cue truly reveals about the suspect's hidden state or lie>", "jane": "<only for a cold read, otherwise omit>"}>>
Stress rules: start from ${stress}. Vague or polite questions: -5 to +3. Aggressive pressing: +5 to +12. Accurate questions touching the hidden truth or presented evidence that threatens the secret: +10 to +25. Irrelevant evidence lets them relax: -3 to -8.`;

  try {
    const runId = request.headers.get("X-Lovable-AIG-Run-ID");
    const result = await streamResponse({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: dialogueHistory(payload.messages),
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }, { signal: request.signal, ...(runId ? { runId } : {}) });
    const stream = createUIMessageStream({
      originalMessages: payload.messages,
      execute: async ({ writer }) => {
        const id = "suspect-reply";
        let started = false;
        for await (const event of result) {
          if (event.type === "response.output_text.delta") {
            if (!started) { writer.write({ type: "text-start", id }); started = true; }
            writer.write({ type: "text-delta", id, delta: naturalText(event.delta) });
          }
          if (event.type === "response.refusal.delta") throw new Error(event.delta || "The conversation request was declined.");
          if (event.type === "response.incomplete") throw new Error("The reply was interrupted. Your conversation is saved.");
        }
        if (!started) throw new Error("No reply was returned. Your conversation is saved.");
        writer.write({ type: "text-end", id });
        writer.write({ type: "finish", finishReason: "stop" });
      },
      onError: (error) => {
        if (error instanceof GatewayError) {
          console.error("Interrogation service error", error.toJSON());
          return naturalText(error.message);
        }
        console.error("Interrogation stream error", error instanceof Error ? error.message : "Unknown stream failure");
        return "The reply was interrupted. Your conversation is saved. Please try again when the connection returns.";
      },
    });
    const headers = new Headers();
    if (result.runId) { headers.set("X-Lovable-AIG-Run-ID", result.runId); headers.set("Access-Control-Expose-Headers", "X-Lovable-AIG-Run-ID"); }
    return createUIMessageStreamResponse({ stream, headers });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    if (error instanceof GatewayError) {
      console.error("Interrogation service error", error.toJSON());
      return Response.json({ message: naturalText(error.message) }, { status: error.httpStatus ?? 503 });
    }
    console.error("Interrogation request error", error instanceof Error ? error.message : "Unknown request failure");
    return Response.json({ message: "The conversation could not start. Your case progress is saved." }, { status: 500 });
  }
}
