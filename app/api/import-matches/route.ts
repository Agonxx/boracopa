import { NextResponse } from "next/server";

interface FDTeam { name: string | null; tla: string | null; }
interface FDMatch {
  id: number; utcDate: string; stage: string;
  group: string | null; matchday: number | null;
  homeTeam: FDTeam; awayTeam: FDTeam; status: string;
}

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: "groups",
  ROUND_OF_16: "r16",
  QUARTER_FINALS: "quarter",
  SEMI_FINALS: "semi",
  FINAL: "final",
};

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: "upcoming", TIMED: "upcoming",
  LIVE: "open", IN_PLAY: "open", PAUSED: "open",
  FINISHED: "finished", POSTPONED: "upcoming",
};

// Converte UTC → BRT (UTC-3) e retorna formato datetime-local "YYYY-MM-DDTHH:MM"
function toBRT(utcDate: string): string {
  const d = new Date(utcDate);
  d.setUTCHours(d.getUTCHours() - 3);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export async function GET() {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "FOOTBALL_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": key }, cache: "no-store" }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Erro da API: ${res.status} — ${text}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const raw: FDMatch[] = data.matches ?? [];

  const matches = raw
    .filter(m => m.homeTeam.name && m.awayTeam.name)
    .map(m => ({
      phase: STAGE_MAP[m.stage] ?? "groups",
      group_name: m.group ? m.group.replace("GROUP_", "") : null,
      round: m.matchday ?? null,
      team_a: m.homeTeam.name!,
      team_b: m.awayTeam.name!,
      code_a: (m.homeTeam.tla ?? "???").toUpperCase(),
      code_b: (m.awayTeam.tla ?? "???").toUpperCase(),
      match_date: toBRT(m.utcDate),
      status: STATUS_MAP[m.status] ?? "upcoming",
      result_a: null as number | null,
      result_b: null as number | null,
    }));

  return NextResponse.json({ count: matches.length, matches });
}
