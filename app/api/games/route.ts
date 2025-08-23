import { NextResponse } from "next/server";

type NormalizedGame = {
  teamName: string;
  opponent: string;
  homeAway: "Home" | "Away";
  competition: string;
  datetimeUTC: string | null;
  venue?: string | null;
  teamLogoUrl?: string | null;
};

type TeamQuery = {
  query: string; // team name to search on TheSportsDB
  expectedSport: string; // e.g., "Soccer", "Basketball", "Baseball"
  displayName?: string; // optional override for display name
};

const TEAM_QUERIES: TeamQuery[] = [
  { query: "FC Barcelona", expectedSport: "Soccer" },
  { query: "Inter Miami CF", expectedSport: "Soccer", displayName: "Inter Miami" },
  { query: "New York Yankees", expectedSport: "Baseball" },
  { query: "New York Knicks", expectedSport: "Basketball" },
];

// Simple in-memory cache with TTL (10 minutes)
type CacheRecord = { timestampMs: number; payload: NormalizedGame[] } | null;
let cache: CacheRecord = null;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function isCacheFresh(record: CacheRecord): record is { timestampMs: number; payload: NormalizedGame[] } {
  return !!record && Date.now() - record.timestampMs < TEN_MINUTES_MS;
}

function getBaseUrl(): string {
  const key = process.env.THESPORTSDB_API_KEY || "123"; // free demo key if not configured
  return `https://www.thesportsdb.com/api/v1/json/${key}`;
}

async function fetchJson<T>(pathAndQuery: string): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}/${pathAndQuery}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`TheSportsDB request failed (${res.status}) for ${pathAndQuery}`);
  }
  return (await res.json()) as T;
}

async function findTeamByName(team: TeamQuery): Promise<{ idTeam: string; strTeam: string; strSport: string; strTeamBadge?: string | null } | null> {
  type SearchTeamsResponse = { teams?: Array<{ idTeam: string; strTeam: string; strSport: string; strTeamBadge?: string | null }> };
  const data = await fetchJson<SearchTeamsResponse>(`searchteams.php?t=${encodeURIComponent(team.query)}`);
  if (!data.teams || data.teams.length === 0) return null;
  const match = data.teams.find((t) => t.strSport?.toLowerCase() === team.expectedSport.toLowerCase()) || data.teams[0];
  return match || null;
}

async function fetchNextEventForTeam(teamId: string) {
  type NextEventsResponse = {
    events?: Array<{
      idEvent: string;
      strEvent?: string | null;
      strLeague?: string | null;
      dateEvent?: string | null; // YYYY-MM-DD
      strTime?: string | null; // HH:mm:ss
      strTimestamp?: string | null; // ISO-ish in UTC if available
      strVenue?: string | null;
      idHomeTeam?: string | null;
      idAwayTeam?: string | null;
      strHomeTeam?: string | null;
      strAwayTeam?: string | null;
    }>;
  };
  return fetchJson<NextEventsResponse>(`eventsnext.php?id=${encodeURIComponent(teamId)}`);
}

function parseUtcIso(dateStr?: string | null, timeStr?: string | null, timestamp?: string | null): string | null {
  // Prefer explicit timestamp if provided
  if (timestamp) {
    const dt = new Date(timestamp);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  if (!dateStr) return null;
  // TheSportsDB times are generally local; when unknown, treat as UTC to avoid TZ drift
  const time = timeStr && /\d{2}:\d{2}/.test(timeStr) ? timeStr : "00:00:00";
  const iso = `${dateStr}T${time}Z`;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

async function getUpcomingGames(): Promise<NormalizedGame[]> {
  // Fetch each team and its next event concurrently
  const results = await Promise.all(
    TEAM_QUERIES.map(async (t) => {
      const teamInfo = await findTeamByName(t);
      if (!teamInfo) return null;

      const next = await fetchNextEventForTeam(teamInfo.idTeam);
      const event = next.events?.[0];
      if (!event) return null;

      const isHome = event.idHomeTeam === teamInfo.idTeam;
      const opponent = isHome ? (event.strAwayTeam || "TBD") : (event.strHomeTeam || "TBD");

      const normalized: NormalizedGame = {
        teamName: t.displayName || teamInfo.strTeam,
        opponent,
        homeAway: isHome ? "Home" : "Away",
        competition: event.strLeague || "",
        datetimeUTC: parseUtcIso(event.dateEvent || null, event.strTime || null, event.strTimestamp || null),
        venue: event.strVenue ?? null,
        teamLogoUrl: teamInfo.strTeamBadge ?? null,
      };

      return normalized;
    })
  );

  return results.filter((g): g is NormalizedGame => g !== null);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force");

  try {
    if (force !== "1" && isCacheFresh(cache)) {
      return NextResponse.json({ source: "cache", items: cache.payload }, { status: 200 });
    }

    const items = await getUpcomingGames();
    cache = { timestampMs: Date.now(), payload: items };
    return NextResponse.json({ source: "live", items }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


