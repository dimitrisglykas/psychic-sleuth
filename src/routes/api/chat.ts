import { createFileRoute } from "@tanstack/react-router";
import { handleMysteryChat } from "@/lib/mystery-chat.server";

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: ({ request }) => handleMysteryChat(request) } },
});