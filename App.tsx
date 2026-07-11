import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  hasSupabaseConfig,
  loadLeagueData,
  MatchRow,
  PlayerRow,
  TournamentRow,
  updateMatchScore,
} from "./src/lib/supabase";

type TabKey = "home" | "league" | "matches" | "tournaments" | "admin";
type MatchStatus = "played" | "scheduled";

type Player = {
  id: string;
  name: string;
  team: string;
  points: number;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
};

type Match = {
  id: string;
  homeId: string;
  awayId: string;
  court: string;
  date: string;
  status: MatchStatus;
  score?: string;
};

type Tournament = {
  id: string;
  title: string;
  category: string;
  date: string;
  entries: number;
  status: "Kayıt açık" | "Yakında" | "Tamamlandı";
};

const initialPlayers: Player[] = [
  {
    id: "p1",
    name: "Mert Yılmaz",
    team: "RTA Yeşil",
    points: 18,
    played: 7,
    won: 6,
    lost: 1,
    setsFor: 13,
    setsAgainst: 4,
  },
  {
    id: "p2",
    name: "Elif Kara",
    team: "RTA Mavi",
    points: 16,
    played: 7,
    won: 5,
    lost: 2,
    setsFor: 12,
    setsAgainst: 6,
  },
  {
    id: "p3",
    name: "Can Demir",
    team: "RTA Beyaz",
    points: 14,
    played: 6,
    won: 5,
    lost: 1,
    setsFor: 10,
    setsAgainst: 5,
  },
  {
    id: "p4",
    name: "Zeynep Aydın",
    team: "RTA Kırmızı",
    points: 11,
    played: 6,
    won: 3,
    lost: 3,
    setsFor: 8,
    setsAgainst: 8,
  },
  {
    id: "p5",
    name: "Arda Şahin",
    team: "RTA Sarı",
    points: 8,
    played: 5,
    won: 2,
    lost: 3,
    setsFor: 6,
    setsAgainst: 8,
  },
];

const initialMatches: Match[] = [
  {
    id: "m1",
    homeId: "p1",
    awayId: "p2",
    court: "Kort 1",
    date: "12 Temmuz 19:00",
    status: "scheduled",
  },
  {
    id: "m2",
    homeId: "p3",
    awayId: "p4",
    court: "Kort 2",
    date: "12 Temmuz 20:00",
    status: "scheduled",
  },
  {
    id: "m3",
    homeId: "p5",
    awayId: "p1",
    court: "Kort 1",
    date: "10 Temmuz",
    status: "played",
    score: "3-6, 4-6",
  },
];

const initialTournaments: Tournament[] = [
  {
    id: "t1",
    title: "RTA Yaz Kupası",
    category: "Tek Erkekler / Kadınlar",
    date: "20-21 Temmuz",
    entries: 32,
    status: "Kayıt açık",
  },
  {
    id: "t2",
    title: "Hafta Sonu Çiftler",
    category: "Karışık Çiftler",
    date: "27 Temmuz",
    entries: 16,
    status: "Yakında",
  },
  {
    id: "t3",
    title: "RTA Bahar Ligi Finali",
    category: "A Klasman",
    date: "30 Haziran",
    entries: 24,
    status: "Tamamlandı",
  },
];

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Ana", icon: "⌂" },
  { key: "league", label: "Lig", icon: "#" },
  { key: "matches", label: "Maç", icon: "□" },
  { key: "tournaments", label: "Turnuva", icon: "◇" },
  { key: "admin", label: "Skor", icon: "+" },
];

function sortPlayers(players: Player[]) {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.setsFor - a.setsAgainst;
    const bDiff = b.setsFor - b.setsAgainst;
    return bDiff - aDiff;
  });
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    team: row.team,
    points: row.points,
    played: row.played,
    won: row.won,
    lost: row.lost,
    setsFor: row.sets_for,
    setsAgainst: row.sets_against,
  };
}

function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    homeId: row.home_id,
    awayId: row.away_id,
    court: row.court,
    date: new Date(row.match_date).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: row.status,
    score: row.score ?? undefined,
  };
}

function mapTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: new Date(row.tournament_date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
    }),
    entries: row.entries,
    status: row.status,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [tournaments, setTournaments] =
    useState<Tournament[]>(initialTournaments);
  const [selectedMatchId, setSelectedMatchId] = useState(initialMatches[0].id);
  const [score, setScore] = useState("");
  const [dataMessage, setDataMessage] = useState(
    hasSupabaseConfig ? "Canlı veriler yükleniyor" : "Örnek veri",
  );

  const standings = useMemo(() => sortPlayers(players), [players]);
  const selectedMatch = matches.find((match) => match.id === selectedMatchId);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!hasSupabaseConfig) {
        return;
      }

      try {
        const result = await loadLeagueData();
        if (!active || !result) return;

        const nextMatches = result.matches.map(mapMatch);
        setPlayers(result.players.map(mapPlayer));
        setMatches(nextMatches);
        setTournaments(result.tournaments.map(mapTournament));
        setSelectedMatchId((current) => nextMatches[0]?.id ?? current);
        setDataMessage("Supabase canlı");
      } catch {
        if (active) {
          setDataMessage("Canlı veri alınamadı, örnek veri gösteriliyor");
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  function playerName(id: string) {
    return players.find((player) => player.id === id)?.name ?? "Oyuncu";
  }

  async function saveScore() {
    if (!selectedMatch || score.trim().length < 3) return;
    const nextScore = score.trim();

    try {
      await updateMatchScore(selectedMatch.id, nextScore);
      setDataMessage(hasSupabaseConfig ? "Skor Supabase'e kaydedildi" : "Örnek veri");
    } catch {
      setDataMessage("Skor yerelde kaydedildi, Supabase yazma izni bekliyor");
    }

    setMatches((current) =>
      current.map((match) =>
        match.id === selectedMatch.id
          ? { ...match, status: "played", score: nextScore }
          : match,
      ),
    );
    setScore("");
    setActiveTab("matches");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Rize Tenis Akademisi</Text>
            <Text style={styles.title}>RTA Ligi</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>{dataMessage}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "home" && (
            <HomeScreen
              standings={standings}
              matches={matches}
              tournaments={tournaments}
              playerName={playerName}
              onOpenLeague={() => setActiveTab("league")}
              onOpenMatches={() => setActiveTab("matches")}
            />
          )}
          {activeTab === "league" && <LeagueScreen standings={standings} />}
          {activeTab === "matches" && (
            <MatchesScreen matches={matches} playerName={playerName} />
          )}
          {activeTab === "tournaments" && (
            <TournamentScreen tournaments={tournaments} />
          )}
          {activeTab === "admin" && (
            <AdminScreen
              matches={matches}
              playerName={playerName}
              selectedMatchId={selectedMatchId}
              score={score}
              onSelectMatch={setSelectedMatchId}
              onChangeScore={setScore}
              onSaveScore={saveScore}
            />
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabItem, selected && styles.tabItemActive]}
              >
                <Text style={[styles.tabIcon, selected && styles.tabTextActive]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, selected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({
  standings,
  matches,
  tournaments,
  playerName,
  onOpenLeague,
  onOpenMatches,
}: {
  standings: Player[];
  matches: Match[];
  tournaments: Tournament[];
  playerName: (id: string) => string;
  onOpenLeague: () => void;
  onOpenMatches: () => void;
}) {
  const nextMatch = matches.find((match) => match.status === "scheduled");
  const openTournament = tournaments.find(
    (tournament) => tournament.status === "Kayıt açık",
  );

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Sezon özeti</Text>
        <Text style={styles.heroTitle}>Lig, ranking ve turnuvalar tek yerde.</Text>
        <View style={styles.heroStats}>
          <Metric label="Lider" value={standings[0].name.split(" ")[0]} />
          <Metric
            label="Maç"
            value={`${matches.filter((match) => match.status === "played").length}/${matches.length}`}
          />
          <Metric label="Turnuva" value={`${tournaments.length}`} />
        </View>
      </View>

      <View style={styles.quickGrid}>
        <Pressable style={styles.actionButton} onPress={onOpenLeague}>
          <Text style={styles.actionTitle}>Puan Durumu</Text>
          <Text style={styles.actionCopy}>Sıralama ve set averajı</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onOpenMatches}>
          <Text style={styles.actionTitle}>Fikstür</Text>
          <Text style={styles.actionCopy}>Sonuçlar ve sıradaki maçlar</Text>
        </Pressable>
      </View>

      {nextMatch && (
        <Section title="Sıradaki Maç">
          <MatchCard match={nextMatch} playerName={playerName} />
        </Section>
      )}

      {openTournament && (
        <Section title="Aktif Turnuva">
          <TournamentCard tournament={openTournament} />
        </Section>
      )}
    </View>
  );
}

function LeagueScreen({ standings }: { standings: Player[] }) {
  return (
    <View style={styles.screen}>
      <Section title="Lig Puan Durumu">
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeadCell, styles.rankCell]}>#</Text>
          <Text style={[styles.tableHeadCell, styles.nameCell]}>Oyuncu</Text>
          <Text style={styles.tableHeadCell}>O</Text>
          <Text style={styles.tableHeadCell}>G</Text>
          <Text style={styles.tableHeadCell}>P</Text>
        </View>
        {standings.map((player, index) => (
          <View key={player.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.rankCell]}>{index + 1}</Text>
            <View style={styles.nameCell}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerTeam}>{player.team}</Text>
            </View>
            <Text style={styles.tableCell}>{player.played}</Text>
            <Text style={styles.tableCell}>{player.won}</Text>
            <Text style={styles.pointsCell}>{player.points}</Text>
          </View>
        ))}
      </Section>

      <Section title="Ranking">
        {standings.map((player, index) => (
          <View key={`rank-${player.id}`} style={styles.rankingRow}>
            <Text style={styles.rankingNumber}>{index + 1}</Text>
            <View style={styles.rankingInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerTeam}>
                Set averajı {player.setsFor - player.setsAgainst > 0 ? "+" : ""}
                {player.setsFor - player.setsAgainst}
              </Text>
            </View>
            <Text style={styles.rankingPoints}>{player.points}</Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

function MatchesScreen({
  matches,
  playerName,
}: {
  matches: Match[];
  playerName: (id: string) => string;
}) {
  return (
    <View style={styles.screen}>
      <Section title="Fikstür ve Sonuçlar">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} playerName={playerName} />
        ))}
      </Section>
    </View>
  );
}

function TournamentScreen({ tournaments }: { tournaments: Tournament[] }) {
  return (
    <View style={styles.screen}>
      <Section title="Turnuvalar">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </Section>
    </View>
  );
}

function AdminScreen({
  matches,
  playerName,
  selectedMatchId,
  score,
  onSelectMatch,
  onChangeScore,
  onSaveScore,
}: {
  matches: Match[];
  playerName: (id: string) => string;
  selectedMatchId: string;
  score: string;
  onSelectMatch: (id: string) => void;
  onChangeScore: (value: string) => void;
  onSaveScore: () => void;
}) {
  return (
    <View style={styles.screen}>
      <Section title="Skor Girişi">
        <Text style={styles.helperText}>
          Bu ekran yönetici girişi bağlandığında maç sonucunu canlı sisteme
          kaydedecek şekilde hazırlanmıştır.
        </Text>
        {matches.map((match) => {
          const selected = match.id === selectedMatchId;
          return (
            <Pressable
              key={match.id}
              onPress={() => onSelectMatch(match.id)}
              style={[styles.selectMatch, selected && styles.selectMatchActive]}
            >
              <Text style={styles.selectMatchTitle}>
                {playerName(match.homeId)} - {playerName(match.awayId)}
              </Text>
              <Text style={styles.selectMatchMeta}>
                {match.date} · {match.score ?? "Skor bekleniyor"}
              </Text>
            </Pressable>
          );
        })}
        <TextInput
          value={score}
          onChangeText={onChangeScore}
          placeholder="Örn. 6-4, 3-6, 10-8"
          placeholderTextColor="#8A968E"
          style={styles.input}
        />
        <Pressable style={styles.primaryButton} onPress={onSaveScore}>
          <Text style={styles.primaryButtonText}>Skoru Kaydet</Text>
        </Pressable>
      </Section>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MatchCard({
  match,
  playerName,
}: {
  match: Match;
  playerName: (id: string) => string;
}) {
  const played = match.status === "played";
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchTopline}>
        <Text style={styles.matchMeta}>
          {match.date} · {match.court}
        </Text>
        <Text style={[styles.statusPill, played && styles.statusPillPlayed]}>
          {played ? "Sonuç" : "Planlandı"}
        </Text>
      </View>
      <Text style={styles.matchPlayers}>
        {playerName(match.homeId)} - {playerName(match.awayId)}
      </Text>
      <Text style={styles.matchScore}>{match.score ?? "Skor girilmedi"}</Text>
    </View>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <View style={styles.tournamentCard}>
      <View style={styles.tournamentHeader}>
        <Text style={styles.tournamentTitle}>{tournament.title}</Text>
        <Text style={styles.tournamentStatus}>{tournament.status}</Text>
      </View>
      <Text style={styles.tournamentMeta}>{tournament.category}</Text>
      <View style={styles.tournamentFooter}>
        <Text style={styles.tournamentInfo}>{tournament.date}</Text>
        <Text style={styles.tournamentInfo}>{tournament.entries} kayıt</Text>
      </View>
    </View>
  );
}

const colors = {
  court: "#0B3B2E",
  clay: "#C85F3E",
  ink: "#15221C",
  muted: "#68756E",
  line: "#DDE5DF",
  paper: "#F7FAF8",
  white: "#FFFFFF",
  gold: "#D6A23D",
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.court,
  },
  app: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    backgroundColor: colors.court,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    color: "#BBD0C6",
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 2,
  },
  liveBadge: {
    backgroundColor: colors.clay,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  liveBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    paddingBottom: 108,
  },
  screen: {
    gap: 16,
  },
  hero: {
    backgroundColor: colors.court,
    borderRadius: 8,
    padding: 18,
    overflow: "hidden",
  },
  heroEyebrow: {
    color: "#BBD0C6",
    fontSize: 13,
    fontWeight: "800",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    marginTop: 8,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  metric: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
  },
  metricValue: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#C9D8D1",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    minHeight: 92,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  actionCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontWeight: "600",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EAF1ED",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeadCell: {
    width: 42,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableCell: {
    width: 42,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  rankCell: {
    width: 28,
  },
  nameCell: {
    flex: 1,
  },
  playerName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  playerTeam: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  pointsCell: {
    width: 42,
    color: colors.clay,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  rankingNumber: {
    width: 34,
    color: colors.gold,
    fontSize: 20,
    fontWeight: "900",
  },
  rankingInfo: {
    flex: 1,
  },
  rankingPoints: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
  },
  matchCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8,
  },
  matchTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  matchMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  statusPill: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#EAF1ED",
    color: colors.court,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusPillPlayed: {
    backgroundColor: "#F7E7DF",
    color: colors.clay,
  },
  matchPlayers: {
    color: colors.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  matchScore: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  tournamentCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 9,
  },
  tournamentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  tournamentTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  tournamentStatus: {
    color: colors.court,
    fontSize: 12,
    fontWeight: "900",
  },
  tournamentMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  tournamentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tournamentInfo: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  helperText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  selectMatch: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    gap: 4,
  },
  selectMatchActive: {
    borderColor: colors.clay,
    backgroundColor: "#FFF8F4",
  },
  selectMatchTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  selectMatchMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.clay,
    borderRadius: 8,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 14,
    minHeight: 70,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    minHeight: 56,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: "#EAF1ED",
  },
  tabIcon: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: "900",
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  tabTextActive: {
    color: colors.court,
  },
});
