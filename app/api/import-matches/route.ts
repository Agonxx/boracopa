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

const PT_NAMES: Record<string, string> = {
  // América do Sul
  "Brazil": "Brasil",
  "Argentina": "Argentina",
  "Uruguay": "Uruguai",
  "Colombia": "Colômbia",
  "Ecuador": "Equador",
  "Paraguay": "Paraguai",
  "Bolivia": "Bolívia",
  "Chile": "Chile",
  "Peru": "Peru",
  "Venezuela": "Venezuela",
  // América do Norte / Central / Caribe
  "United States": "Estados Unidos",
  "Mexico": "México",
  "Canada": "Canadá",
  "Costa Rica": "Costa Rica",
  "Panama": "Panamá",
  "Honduras": "Honduras",
  "El Salvador": "El Salvador",
  "Jamaica": "Jamaica",
  "Haiti": "Haiti",
  "Trinidad and Tobago": "Trinidad e Tobago",
  "Curaçao": "Curaçao",
  // Europa
  "France": "França",
  "Germany": "Alemanha",
  "Spain": "Espanha",
  "Portugal": "Portugal",
  "England": "Inglaterra",
  "Netherlands": "Holanda",
  "Belgium": "Bélgica",
  "Croatia": "Croácia",
  "Switzerland": "Suíça",
  "Italy": "Itália",
  "Poland": "Polônia",
  "Ukraine": "Ucrânia",
  "Serbia": "Sérvia",
  "Scotland": "Escócia",
  "Austria": "Áustria",
  "Turkey": "Turquia",
  "Czechia": "República Tcheca",
  "Czech Republic": "República Tcheca",
  "Slovakia": "Eslováquia",
  "Hungary": "Hungria",
  "Romania": "Romênia",
  "Greece": "Grécia",
  "Albania": "Albânia",
  "Wales": "Gales",
  "Bosnia and Herzegovina": "Bósnia-Herzegovina",
  "Bosnia-Herzegovina": "Bósnia-Herzegovina",
  "Denmark": "Dinamarca",
  "Sweden": "Suécia",
  "Norway": "Noruega",
  "Finland": "Finlândia",
  "Iceland": "Islândia",
  "Slovenia": "Eslovênia",
  "Kosovo": "Kosovo",
  "Georgia": "Geórgia",
  // África
  "Morocco": "Marrocos",
  "Senegal": "Senegal",
  "Nigeria": "Nigéria",
  "Ghana": "Gana",
  "Ivory Coast": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  "Cameroon": "Camarões",
  "South Africa": "África do Sul",
  "Egypt": "Egito",
  "Algeria": "Argélia",
  "Tunisia": "Tunísia",
  "Mali": "Mali",
  "DR Congo": "RD Congo",
  "Tanzania": "Tanzânia",
  "Kenya": "Quênia",
  "Benin": "Benim",
  "Guinea": "Guiné",
  "Comoros": "Comores",
  "Angola": "Angola",
  "Zambia": "Zâmbia",
  "Uganda": "Uganda",
  "Mozambique": "Moçambique",
  // Ásia / Oceania
  "Japan": "Japão",
  "South Korea": "Coreia do Sul",
  "Saudi Arabia": "Arábia Saudita",
  "Iran": "Irã",
  "Australia": "Austrália",
  "Qatar": "Catar",
  "Uzbekistan": "Uzbequistão",
  "China PR": "China",
  "China": "China",
  "Indonesia": "Indonésia",
  "New Zealand": "Nova Zelândia",
  "Iraq": "Iraque",
  "Jordan": "Jordânia",
  "Oman": "Omã",
  "Bahrain": "Bahrein",
  "United Arab Emirates": "Emirados Árabes",
};

function ptName(name: string): string {
  return PT_NAMES[name] ?? name;
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
      team_a: ptName(m.homeTeam.name!),
      team_b: ptName(m.awayTeam.name!),
      code_a: (m.homeTeam.tla ?? "???").toUpperCase(),
      code_b: (m.awayTeam.tla ?? "???").toUpperCase(),
      match_date: new Date(m.utcDate).toISOString(),
      status: STATUS_MAP[m.status] ?? "upcoming",
      result_a: null as number | null,
      result_b: null as number | null,
    }));

  return NextResponse.json({ count: matches.length, matches });
}
