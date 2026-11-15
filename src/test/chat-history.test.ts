import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { dialogueHistory, restoredDialogue } from "../lib/chat-history";

describe("saved interrogation history", () => {
  it("recovers usable saved dialogue without malformed or provider-specific parts", () => {
    expect(restoredDialogue([null, { role: "assistant", parts: null }, { id: "saved", role: "assistant", parts: [null, { type: "text", text: "A debt.", providerMetadata: { openai: { itemId: "old" } } }] }])).toEqual([{ id: "saved", role: "assistant", parts: [{ type: "text", text: "A debt." }] }]);
    expect(restoredDialogue({ messages: [] })).toEqual([]);
  });
  it("replays saved dialogue inline without stale provider item references", () => {
    const messages: UIMessage[] = [
      { id: "a", role: "user", parts: [{ type: "text", text: "What were you hiding?" }] },
      { id: "b", role: "assistant", parts: [{ type: "step-start" }, { type: "text", text: "A debt.", providerMetadata: { openai: { itemId: "msg_old", phase: "final_answer" } } }] },
      { id: "c", role: "user", parts: [{ type: "text", text: "Hi" }] },
    ];
    expect(dialogueHistory(messages)).toEqual([
      { role: "user", content: "What were you hiding?" },
      { role: "assistant", content: "A debt." },
      { role: "user", content: "Hi" },
    ]);
  });
  it("omits empty assistant messages left behind by failed streams", () => {
    expect(dialogueHistory([{ id: "empty", role: "assistant", parts: [] }])).toEqual([]);
  });
});