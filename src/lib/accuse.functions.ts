import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  caseCode: z.string().max(8),
  culprit: z.string().max(40),
  motive: z.string().max(40),
  clues: z.array(z.string().max(40)).max(2),
});

// Verifies an accusation server-side; the solution never ships to the browser.
export const checkAccusation = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("case_files")
      .select("solution, ending_win, ending_lines")
      .eq("case_code", data.caseCode)
      .maybeSingle();
    if (error || !row?.solution) throw new Error("Case not found");
    const sol = row.solution as { culprit: string; motive: string; clues: string[] };
    const won = data.culprit === sol.culprit;
    const motiveOk = data.motive === sol.motive;
    const clueOk = data.clues.map((c) => sol.clues.includes(c));
    const score = Math.round((won ? 50 : 0) + (motiveOk ? 25 : 0) + clueOk.filter(Boolean).length * 12.5);
    return { won, motiveOk, clueOk, score, win: row.ending_win ?? "", lines: (row.ending_lines as string[] | null) ?? [] };
  });
