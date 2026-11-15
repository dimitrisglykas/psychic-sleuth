import { afterEach, describe, expect, it, vi } from "vitest";
import { interrogationFetch } from "../lib/chat-transport";

afterEach(() => vi.unstubAllGlobals());
describe("interrogation errors", () => {
  it("preserves the service status and safe reason instead of showing JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "AI credits are exhausted." }, { status: 402 })));
    const response = await interrogationFetch("/api/chat");
    expect(response.status).toBe(402);
    expect(await response.text()).toBe("AI credits are exhausted.");
  });
  it("passes successful streams through untouched", async () => {
    const stream = new Response('data: {"type":"start"}\n\n');
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stream));
    expect(await interrogationFetch("/api/chat")).toBe(stream);
  });
});