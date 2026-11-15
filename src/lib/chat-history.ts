import type { UIMessage } from "ai";

// Only portable text is needed for interrogation saves. Older or interrupted
// records can contain provider parts or malformed values that break useChat.
export function restoredDialogue(value: unknown): UIMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object" || !("role" in entry) || !("parts" in entry)) return [];
    if ((entry.role !== "user" && entry.role !== "assistant") || !Array.isArray(entry.parts)) return [];
    const text = entry.parts.flatMap((part: unknown) => {
      if (!part || typeof part !== "object" || !("type" in part) || !("text" in part)) return [];
      return part.type === "text" && typeof part.text === "string" ? [part.text] : [];
    }).join("");
    if (!text.trim()) return [];
    const id = "id" in entry && typeof entry.id === "string" ? entry.id : `restored-${entry.role}-${text.length}`;
    return [{ id, role: entry.role, parts: [{ type: "text" as const, text }] }];
  });
}

// Browser transcripts are portable dialogue, not provider-held response IDs.
export function dialogueHistory(messages: UIMessage[]) {
  return messages.flatMap((message) => {
    if (message.role !== "user" && message.role !== "assistant") return [];
    const content = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
    return content.trim() ? [{ role: message.role, content }] : [];
  });
}