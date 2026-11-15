import { describe, expect, it } from "vitest";
import { isLanguage, naturalText, translate } from "../game/language";
describe("player language and natural punctuation", () => {
  it("allows English, Greek, Spanish, and French", () => {
    expect(["en", "el", "es", "fr"].every(isLanguage)).toBe(true);
    expect(isLanguage("xx")).toBe(false);
  });
  it("removes long dashes even from saved AI observations", () => {
    expect(naturalText("A pause\u2014then a lie\u2013watch his hands")).toBe("A pause,then a lie,watch his hands");
  });
  it("translates the briefing start control in every chosen language", () => {
    for (const language of ["el", "es", "fr"] as const) expect(translate("Start the investigation", language)).not.toBe("Start the investigation");
  });
});