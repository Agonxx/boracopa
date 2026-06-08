const TLA_TO_ISO2: Record<string, string> = {
  // América do Sul
  BRA: "br", ARG: "ar", URU: "uy", COL: "co", ECU: "ec",
  PAR: "py", BOL: "bo", CHL: "cl", PER: "pe", VEN: "ve",
  // CONCACAF
  USA: "us", MEX: "mx", CAN: "ca", CRC: "cr", PAN: "pa",
  HON: "hn", SLV: "sv", JAM: "jm", HAI: "ht", TRI: "tt", CUW: "cw",
  // Europa
  FRA: "fr", GER: "de", ESP: "es", POR: "pt", ENG: "gb-eng",
  NED: "nl", BEL: "be", CRO: "hr", SUI: "ch", ITA: "it",
  POL: "pl", UKR: "ua", SRB: "rs", SCO: "gb-sct", AUT: "at",
  TUR: "tr", CZE: "cz", SVK: "sk", HUN: "hu", ROU: "ro",
  GRE: "gr", ALB: "al", WAL: "gb-wls", BIH: "ba", DEN: "dk",
  SWE: "se", NOR: "no", FIN: "fi", ISL: "is", SVN: "si",
  KOS: "xk", GEO: "ge",
  // África
  MAR: "ma", SEN: "sn", NGA: "ng", GHA: "gh", CIV: "ci",
  CMR: "cm", RSA: "za", EGY: "eg", ALG: "dz", TUN: "tn",
  MLI: "ml", COD: "cd", TAN: "tz", KEN: "ke", BEN: "bj",
  GUI: "gn", COM: "km", ANG: "ao", ZAM: "zm", UGA: "ug", MOZ: "mz",
  // Ásia / Oceania
  JPN: "jp", KOR: "kr", KSA: "sa", IRN: "ir", AUS: "au",
  QAT: "qa", UZB: "uz", CHN: "cn", IDN: "id", NZL: "nz",
  IRQ: "iq", JOR: "jo", OMA: "om", BHR: "bh", UAE: "ae",
};

// Emojis especiais para nações do Reino Unido
const SPECIAL_EMOJI: Record<string, string> = {
  "gb-eng": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "gb-sct": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "gb-wls": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

function toEmoji(iso2: string): string {
  if (SPECIAL_EMOJI[iso2]) return SPECIAL_EMOJI[iso2];
  return [...iso2.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function Flag({ code, size = 34 }: { code: string; size?: number }) {
  const iso2 = TLA_TO_ISO2[code?.toUpperCase()];

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
