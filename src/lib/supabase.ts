import { createClient } from "@supabase/supabase-js";

export type PlayerRow = {
  id: string;
  name: string;
  team: string;
  points: number;
  played: number;
  won: number;
  lost: number;
  sets_for: number;
  sets_against: number;
};

export type MatchRow = {
  id: string;
  home_id: string;
  away_id: string;
  court: string;
  match_date: string;
  status: "played" | "scheduled";
  score: string | null;
};

export type TournamentRow = {
  id: string;
  title: string;
  category: string;
  tournament_date: string;
  entries: number;
  status: "Kayıt açık" | "Yakında" | "Tamamlandı";
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export async function loadLeagueData() {
  if (!supabase) {
    return null;
  }

  const [playersResult, matchesResult, tournamentsResult] = await Promise.all([
    supabase.from("players").select("*").order("points", { ascending: false }),
    supabase.from("matches").select("*").order("match_date", { ascending: true }),
    supabase
      .from("tournaments")
      .select("*")
      .order("tournament_date", { ascending: true }),
  ]);

  if (playersResult.error) throw playersResult.error;
  if (matchesResult.error) throw matchesResult.error;
  if (tournamentsResult.error) throw tournamentsResult.error;

  return {
    players: playersResult.data as PlayerRow[],
    matches: matchesResult.data as MatchRow[],
    tournaments: tournamentsResult.data as TournamentRow[],
  };
}

export async function updateMatchScore(matchId: string, score: string) {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("matches")
    .update({ score, status: "played" })
    .eq("id", matchId);

  if (error) throw error;
  return true;
}
