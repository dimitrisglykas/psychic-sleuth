// Offline in-character replies used when the live interrogation service fails.
// Output keeps the same `<<META {...}>>` contract as live replies so game state stays consistent.

export type FallbackInput = { name: string; short: string; stress: number; evidenceTitle?: string | null; pressing?: boolean; turn: number };

const CALM = [
  "I have already told you everything I know. Ask your questions plainly.",
  "You are wasting your evening on me. Look elsewhere.",
  "I was where I said I was. Nothing about tonight has changed that.",
];
const RATTLED = [
  "Why do you keep coming back to that? I answered you.",
  "I do not like where this is going. Ask what you really mean.",
  "You are twisting small things into something they are not.",
];
const BREAKING = [
  "Stop. Just stop. You do not understand what that night was like.",
  "Fine. I was not completely honest. But it is not what you think.",
  "Please. If I say more, everything falls apart.",
];

export function fallbackStress(stress: number, hasEvidence: boolean, pressing: boolean) {
  const delta = (hasEvidence ? 8 : 2) + (pressing ? 5 : 0);
  return Math.max(0, Math.min(100, Math.round(stress + delta)));
}

export function fallbackReply({ name, short, stress, evidenceTitle, pressing = false, turn }: FallbackInput) {
  const next = fallbackStress(stress, !!evidenceTitle, pressing);
  const pool = next >= 75 ? BREAKING : next >= 50 ? RATTLED : CALM;
  const line = pool[Math.abs(turn) % pool.length]!;
  const speech = evidenceTitle ? `${evidenceTitle}? I... I have nothing to say about that. ${line}` : line;
  const meta = {
    stress: next,
    observation: next >= 50 ? `${short} looks away and grips the chair` : `${short} keeps a steady, practiced smile`,
    tell: next >= 50
      ? `${name} broke eye contact the moment that landed. People only guard what matters to them.`
      : `${name} answered too smoothly. A rehearsed calm is still a performance.`,
  };
  return `${speech}\n<<META ${JSON.stringify(meta)}>>`;
}
