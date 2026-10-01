import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CASE_CLUES: Record<string, string[]> = {
  "001": ["watch", "invoice", "ash", "print", "clock", "safe", "glass"],
  "002": ["gap", "bribe", "paste", "badge", "radio", "tie", "claim"],
};
const Name = z.string().trim().min(1).max(24);
const Code = z.string().trim().toUpperCase().regex(/^[A-Z2-9]{10}$/);
const Token = z.string().regex(/^[a-f0-9]{48}$/);
const Credentials = z.object({ roomId: z.string().uuid(), memberToken: Token });

type SharedOutcome = { won: boolean; score: number; rating: string };
export type LobbyState = {
  roomId: string; caseCode: string; inviteCode?: string; memberToken?: string;
  members: { name: string; active: boolean }[]; clues: string[]; progress: number;
  outcome: SharedOutcome | null; lastEvent: { text: string; at: string } | null;
};

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes: number) {
  const value = new Uint8Array(bytes); crypto.getRandomValues(value);
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function inviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const value = new Uint8Array(10); crypto.getRandomValues(value);
  return Array.from(value, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function roomForMember(roomId: string, memberToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const memberHash = await digest(memberToken);
  const { data: member } = await supabaseAdmin.from("case_room_members").select("id, room_id").eq("room_id", roomId).eq("member_hash", memberHash).maybeSingle();
  if (!member) throw new Error("This room invitation is no longer valid.");
  await supabaseAdmin.from("case_room_members").update({ last_seen_at: new Date().toISOString() }).eq("id", member.id);
  return supabaseAdmin;
}

async function stateFor(supabaseAdmin: Awaited<ReturnType<typeof roomForMember>>, roomId: string): Promise<LobbyState> {
  const { data: room } = await supabaseAdmin.from("case_rooms").select("id, case_code, shared_clues, progress, outcome, last_event, expires_at").eq("id", roomId).maybeSingle();
  if (!room || new Date(room.expires_at).getTime() < Date.now()) throw new Error("This room has expired.");
  const { data: members } = await supabaseAdmin.from("case_room_members").select("display_name, last_seen_at").eq("room_id", roomId).order("created_at");
  return {
    roomId: room.id, caseCode: room.case_code,
    clues: Array.isArray(room.shared_clues) ? room.shared_clues.filter((v): v is string => typeof v === "string") : [],
    progress: room.progress, outcome: room.outcome as SharedOutcome | null,
    lastEvent: room.last_event as LobbyState["lastEvent"],
    members: (members ?? []).map((member) => ({ name: member.display_name, active: Date.now() - new Date(member.last_seen_at).getTime() < 45_000 })),
  };
}

export const createLobby = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ caseCode: z.enum(["001", "002"]), displayName: Name, clues: z.array(z.string()).max(12) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = inviteCode(); const memberToken = randomHex(24);
    const allowed = CASE_CLUES[data.caseCode] ?? [];
    const clues = [...new Set(data.clues.filter((clue) => allowed.includes(clue)))];
    const { data: room, error } = await supabaseAdmin.from("case_rooms").insert({ case_code: data.caseCode, invite_hash: await digest(code), shared_clues: clues, progress: Math.round(clues.length / allowed.length * 100), last_event: { text: `${data.displayName} opened the case room.`, at: new Date().toISOString() } }).select("id").single();
    if (error || !room) throw new Error("The case room could not be opened.");
    const { error: memberError } = await supabaseAdmin.from("case_room_members").insert({ room_id: room.id, member_hash: await digest(memberToken), display_name: data.displayName });
    if (memberError) throw new Error("The host could not enter the room.");
    const state = await stateFor(supabaseAdmin, room.id);
    return { ...state, inviteCode: code, memberToken };
  });

export const joinLobby = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ inviteCode: Code, displayName: Name }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: room } = await supabaseAdmin.from("case_rooms").select("id").eq("invite_hash", await digest(data.inviteCode)).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (!room) throw new Error("That invite code is invalid or expired.");
    const memberToken = randomHex(24);
    const { error } = await supabaseAdmin.from("case_room_members").insert({ room_id: room.id, member_hash: await digest(memberToken), display_name: data.displayName });
    if (error) throw new Error("You could not join this room.");
    const state = await stateFor(supabaseAdmin, room.id);
    return { ...state, inviteCode: data.inviteCode, memberToken };
  });

export const getLobby = createServerFn({ method: "POST" })
  .inputValidator((input) => Credentials.parse(input))
  .handler(async ({ data }) => stateFor(await roomForMember(data.roomId, data.memberToken), data.roomId));

export const updateLobby = createServerFn({ method: "POST" })
  .inputValidator((input) => Credentials.extend({ clues: z.array(z.string()).max(12), progress: z.number().int().min(0).max(100), event: z.string().trim().max(80).optional() }).parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await roomForMember(data.roomId, data.memberToken);
    const { data: room } = await supabaseAdmin.from("case_rooms").select("case_code, shared_clues").eq("id", data.roomId).single();
    if (!room) throw new Error("This room is no longer available.");
    const allowed = CASE_CLUES[room.case_code] ?? [];
    const previous = Array.isArray(room.shared_clues) ? room.shared_clues.filter((v): v is string => typeof v === "string") : [];
    const clues = [...new Set([...previous, ...data.clues])].filter((clue) => allowed.includes(clue));
    const update: { shared_clues: string[]; progress: number; last_event?: { text: string; at: string } } = { shared_clues: clues, progress: Math.max(data.progress, Math.round(clues.length / allowed.length * 100)) };
    if (data.event) update.last_event = { text: data.event, at: new Date().toISOString() };
    await supabaseAdmin.from("case_rooms").update(update).eq("id", data.roomId);
    return stateFor(supabaseAdmin, data.roomId);
  });

export const saveLobbyOutcome = createServerFn({ method: "POST" })
  .inputValidator((input) => Credentials.extend({ outcome: z.object({ won: z.boolean(), score: z.number().int().min(0).max(100), rating: z.string().max(40) }) }).parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await roomForMember(data.roomId, data.memberToken);
    await supabaseAdmin.from("case_rooms").update({ outcome: data.outcome, progress: 100, last_event: { text: "The team made its final accusation.", at: new Date().toISOString() } }).eq("id", data.roomId);
    return stateFor(supabaseAdmin, data.roomId);
  });