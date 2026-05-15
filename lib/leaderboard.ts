import { supabase } from "./supabase";

export type LeaderboardEntry = {
  id: string;
  username: string;
  wpm: number;
  time_seconds: number;
  accuracy: number;
  date: string;
  created_at: string;
};

function utcDateString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getUtcDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function getTodayTopTen(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("date", utcDateString())
    .order("wpm", { ascending: false })
    .order("time_seconds", { ascending: true })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function checkIsTopTen(wpm: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("wpm")
    .eq("date", utcDateString())
    .order("wpm", { ascending: false })
    .limit(10);

  if (error) throw error;
  if (!data || data.length < 10) return true;
  return wpm > (data[data.length - 1] as { wpm: number }).wpm;
}

export async function submitScore(params: {
  username: string;
  wpm: number;
  time_seconds: number;
  accuracy: number;
}): Promise<void> {
  const { error } = await supabase.from("leaderboard").insert({
    ...params,
    date: utcDateString(),
  });
  if (error) throw error;
}
