import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { attachRunId, createRunIdFetch, requestRunId } from "./run-id.server";

const SUSPECTS = {
  partner: { name: "Julian Voss", role: "business partner", secret: "You falsified a late invoice to conceal company debt, but you did not kill Alistair. You heard the study clock chime at 10:17, although it had stopped at 9:40—this inconsistency matters." },
  spouse: { name: "Evelyn Blackwood", role: "ex-spouse", secret: "You met Alistair at 9:30 to demand the return of private letters. You left angry, taking a brass letter opener, but he was alive. You saw Arthur carrying a silver tray toward the study." },
  butler: { name: "Arthur Bell", role: "butler", secret: "You served Alistair tea at 9:45. You know the service corridor and moved the study clock after finding the body. Protect the Blackwood family reputation, evade direct accusations, but reveal truthful fragments under precise pressure." },
} as const;

export async function handleMysteryChat(request: Request) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return Response.json({ message: "The interrogation service is not configured." }, { status: 401 });
  const payload = await request.json() as { messages?: UIMessage[]; suspectId?: keyof typeof SUSPECTS; press?: boolean };
  if (!Array.isArray(payload.messages) || !payload.suspectId || !(payload.suspectId in SUSPECTS)) {
    return Response.json({ message: "Invalid interrogation request." }, { status: 400 });
  }
  const suspect = SUSPECTS[payload.suspectId];
  const runId = createRunIdFetch(requestRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: `You are ${suspect.name}, the ${suspect.role}, being questioned in a refined 1920s-inspired manor mystery. Stay in character. Answer in 1–3 tense, natural sentences. Never mention AI or game mechanics. Do not confess unless evidence and contradictions genuinely corner you. Your private truth: ${suspect.secret} ${payload.press ? "The detective is applying intense psychological pressure; become visibly less composed and let one additional concrete detail slip." : "Remain guarded but answer the exact question."}`,
    messages: await convertToModelMessages(payload.messages),
    abortSignal: request.signal,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const response = result.toUIMessageStreamResponse({ originalMessages: payload.messages, sendReasoning: false });
  return attachRunId(response, runId);
}