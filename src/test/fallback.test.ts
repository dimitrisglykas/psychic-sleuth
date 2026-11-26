import { describe, expect, it } from "vitest";
import { fallbackReply, fallbackStress } from "@/game/fallback";
import { parseReply } from "@/components/game/interrogation";

describe("offline suspect fallback", () => {
  it("raises stress more when evidence is presented", () => {
    expect(fallbackStress(40, false, false)).toBe(42);
    expect(fallbackStress(40, true, false)).toBe(48);
    expect(fallbackStress(40, true, true)).toBe(53);
  });
  it("caps stress at 100", () => { expect(fallbackStress(98, true, true)).toBe(100); });
  it("returns a reply with parseable game metadata", () => {
    const out = parseReply(fallbackReply({ name: "Julian Voss", short: "Julian", stress: 70, evidenceTitle: "Invoice", turn: 1 }));
    expect(out.speech).toContain("Invoice");
    expect(out.meta?.stress).toBe(78);
  });
});
