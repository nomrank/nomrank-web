"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

export type VoteResult = { votes: { a: number; b: number } } | { error: string };

const input = z.object({ battle: z.uuid(), side: z.enum(["a", "b"]) });

// Cast or change your vote in a battle. The database allows one vote per person per battle; the tally it returns is
// the real one, so the screen shows what everyone sees.
export async function voteBattle(battle: string, side: string): Promise<VoteResult> {
  const parsed = input.safeParse({ battle, side });
  if (!parsed.success) return { error: "That battle isn't valid." };
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) return { error: "Finish setting up your profile to vote." };

  const { error } = await supabase
    .from("battle_votes")
    .upsert({ battle_id: parsed.data.battle, user_id: userId, side: parsed.data.side }, { onConflict: "battle_id,user_id" });
  if (error) {
    if (error.code === "54000") return { error: "Slow down a little. Try again in a bit." };
    if (error.code === "42501") return { error: "This account can't vote right now." };
    return { error: "Couldn't save your vote. Try again." };
  }
  const { data } = await supabase.from("battle_tally").select("a, b").eq("battle_id", parsed.data.battle).maybeSingle();
  return { votes: { a: Number(data?.a ?? 0), b: Number(data?.b ?? 0) } };
}
