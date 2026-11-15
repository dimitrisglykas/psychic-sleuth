import type { UIMessage } from "ai";

// Browser transcripts are portable dialogue, not provider-held response IDs.
export function dialogueHistory(messages: UIMessage[]) {
  return messages.flatMap((message) => {
    if (message.role !== "user" && message.role !== "assistant") return [];
    const content = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
    return content.trim() ? [{ role: message.role, content }] : [];
  });
}