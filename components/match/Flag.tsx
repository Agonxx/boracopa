const TLA_TO_FILE: Record<string, string> = {
  // América do Sul
  BRA: "Brazil",
  ARG: "Argentina",
  URU: "Uruguay",
  COL: "Colombia",
  ECU: "Ecuador",
  PAR: "Paraguay",
  // CONCACAF
  USA: "United States of America",
  MEX: "Mexico",
  CAN: "Canada",
  PAN: "Panama",
  HAI: "Haiti",
  CUW: "Curaçao",
  // Europa
  FRA: "France",
  GER: "Germany",
  ESP: "Spain",
  POR: "Portugal",
  ENG: "England",
  NED: "Netherlands",
  BEL: "Belgium",
  CRO: "Croatia",
  SUI: "Switzerland",
  SCO: "Scotland",
  AUT: "Austria",
  TUR: "Türkiye or Turkey",
  CZE: "Czech Republic or Czechia",
  BIH: "Bosnia and Herzegovina",
  SWE: "Sweden",
  NOR: "Norway",
  // África
  MAR: "Morocco",
  SEN: "Senegal",
  GHA: "Ghana",
  CIV: "Côte d'Ivoire or Ivory Coast",
  RSA: "South Africa",
  EGY: "Egypt",
  ALG: "Algeria",
  TUN: "Tunisia",
  COD: "Democratic Republic of the Congo or DR Congo",
  // Ásia / Oceania
  JPN: "Japan",
  KOR: "South Korea",
  KSA: "Saudi Arabia",
  IRN: "Iran",
  AUS: "Australia",
  QAT: "Qatar",
  UZB: "Uzbekistan",
  NZL: "New Zealand",
  IRQ: "Iraq",
  JOR: "Jordan",
};

// Emoji fallback para seleções sem imagem
const TLA_TO_ISO2: Record<string, string> = {
  BOL: "bo", CHL: "cl", PER: "pe", VEN: "ve",
  CRC: "cr", HON: "hn", SLV: "sv", JAM: "jm", TRI: "tt",
  ITA: "it", POL: "pl", UKR: "ua", SRB: "rs", SVK: "sk",
  HUN: "hu", ROU: "ro", GRE: "gr", ALB: "al", WAL: "gb-wls",
  DEN: "dk", FIN: "fi", ISL: "is", SVN: "si", KOS: "xk", GEO: "ge",
  NGA: "ng", CMR: "cm", MLI: "ml", TAN: "tz", KEN: "ke",
  BEN: "bj", GUI: "gn", COM: "km", ANG: "ao", ZAM: "zm", UGA: "ug", MOZ: "mz",
  CHN: "cn", IDN: "id", BHR: "bh", UAE: "ae", OMA: "om",
};

const SPECIAL_EMOJI: Record<string, string> = {
  "gb-wls": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "gb-sct": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
};

function toEmoji(iso2: string): string {
  if (SPECIAL_EMOJI[iso2]) return SPECIAL_EMOJI[iso2];
  return [...iso2.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function Flag({ code, size = 34 }: { code: string; size?: number }) {
  const upper = code?.toUpperCase();
  const file = TLA_TO_FILE[upper];

  if (file) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: "1.5px solid var(--line-strong)",
      }}>
        <img
          src={`/flags/${encodeURIComponent(file)}.jpg`}
          alt={code}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
        />
      </div>
    );
  }

  const iso2 = TLA_TO_ISO2[upper];
  if (iso2) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: "1.5px solid var(--line-strong)",
        display: "grid", placeItems: "center",
        fontSize: size * 0.72, lineHeight: 1,
        overflow: "hidden", background: "var(--surface)",
      }}>
        {toEmoji(iso2)}
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--app-bg)", border: "1.5px solid var(--line-strong)",
      display: "grid", placeItems: "center",
      fontFamily: "Anton, sans-serif", fontSize: size * 0.36, color: "var(--ink)",
      letterSpacing: 0.5,
    }}>
      {code}
    </div>
  );
}
