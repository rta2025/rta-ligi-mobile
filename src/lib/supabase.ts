import { createClient } from "@supabase/supabase-js";

export type PlayerRow = {
  id: string;
  name: string;
  team: string;
  league_code: string;
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
  league_code: string;
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

type RtaPlayer = {
  id: number | string;
  name: string;
  league: string;
};

type RtaMatch = {
  id: number | string;
  league: string;
  winner: number | string;
  loser: number | string;
  match_date: string | null;
  score: string | null;
  sets_json: string | null;
  winning_sets: number | null;
  losing_sets: number | null;
  wpts: number | null;
  lpts: number | null;
  walkover: boolean | null;
};

type RtaRankingEntry = {
  id: string;
  season_id: number | string | null;
  player: string;
  league: string | null;
  rank_no: number | null;
  source: string | null;
  label: string | null;
  points: number | null;
  earned_date: string | null;
};

const leagueLabels: Record<string, string> = {
  super: "RTA Super Ligi",
  l2: "RTA 2. Lig",
  l3: "RTA 3. Lig",
  l4: "RTA 4. Lig",
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

function parseSets(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureId(value: number | string) {
  return String(value);
}

function buildPlayerRows(players: RtaPlayer[], matches: RtaMatch[]): PlayerRow[] {
  const standings = new Map<string, PlayerRow>();

  players.forEach((player) => {
    standings.set(ensureId(player.id), {
      id: ensureId(player.id),
      name: player.name,
      team: leagueLabels[player.league] ?? player.league ?? "RTA",
      league_code: player.league,
      points: 0,
      played: 0,
      won: 0,
      lost: 0,
      sets_for: 0,
      sets_against: 0,
    });
  });

  matches.forEach((match) => {
    const winner = standings.get(ensureId(match.winner));
    const loser = standings.get(ensureId(match.loser));
    if (!winner || !loser) return;

    winner.played += 1;
    winner.won += 1;
    winner.points += match.wpts ?? 0;
    winner.sets_for += match.winning_sets ?? 0;
    winner.sets_against += match.losing_sets ?? 0;

    loser.played += 1;
    loser.lost += 1;
    loser.points += match.lpts ?? 0;
    loser.sets_for += match.losing_sets ?? 0;
    loser.sets_against += match.winning_sets ?? 0;
  });

  return Array.from(standings.values());
}

function buildMatchRows(matches: RtaMatch[]): MatchRow[] {
  return matches
    .slice(0, 100)
    .map((match) => ({
      id: ensureId(match.id),
      home_id: ensureId(match.winner),
      away_id: ensureId(match.loser),
      court: leagueLabels[match.league] ?? match.league ?? "RTA",
      league_code: match.league,
      match_date: match.match_date ?? new Date().toISOString(),
      status: "played",
      score: match.score ?? formatSets(parseSets(match.sets_json)),
    }));
}

function formatSets(sets: unknown[]) {
  const score = sets
    .filter((set): set is [number, number] => Array.isArray(set) && set.length >= 2)
    .map(([left, right]) => `${left}-${right}`)
    .join(" / ");

  return score || null;
}

function buildTournamentRows(entries: RtaRankingEntry[]): TournamentRow[] {
  const tournaments = new Map<string, TournamentRow>();

  entries
    .filter((entry) => entry.source === "tournament")
    .forEach((entry) => {
      const title = entry.label || "Turnuva Puani";
      const date = entry.earned_date ?? new Date().toISOString();
      const key = `${entry.season_id ?? title}-${title}-${date}`;
      const existing = tournaments.get(key);

      if (existing) {
        existing.entries += 1;
        return;
      }

      tournaments.set(key, {
        id: key,
        title,
        category: entry.league ? leagueLabels[entry.league] ?? entry.league : "Ranking",
        tournament_date: date,
        entries: 1,
        status: "Tamamlandı",
      });
    });

  return Array.from(tournaments.values());
}

export async function loadLeagueData() {
  if (!supabase) {
    return null;
  }

  const [playersResult, matchesResult, rankingResult] = await Promise.all([
    supabase.from("players").select("id,name,league").order("id"),
    supabase
      .from("matches")
      .select(
        "id,league,winner,loser,match_date,score,sets_json,winning_sets,losing_sets,wpts,lpts,walkover",
      )
      .order("match_date", { ascending: false }),
    supabase.from("ranking_entries").select("*"),
  ]);

  if (playersResult.error) throw playersResult.error;
  if (matchesResult.error) throw matchesResult.error;
  if (rankingResult.error) throw rankingResult.error;

  const players = (playersResult.data ?? []) as RtaPlayer[];
  const matches = (matchesResult.data ?? []) as RtaMatch[];
  const ranking = (rankingResult.data ?? []) as RtaRankingEntry[];

  return {
    players: buildPlayerRows(players, matches),
    matches: buildMatchRows(matches),
    tournaments: buildTournamentRows(ranking),
  };
}

export async function updateMatchScore(_matchId?: string, _score?: string) {
  return false;
}
