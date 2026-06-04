import Flag from "./Flag";

const COLS = [
  { key: "oitavas", label: "Oitavas", matches: [["BR","UY"],["FR","HR"],["EN","SN"],["PT","MA"]] },
  { key: "quartas", label: "Quartas", matches: [["BR","FR"],["EN","PT"]] },
  { key: "semi",    label: "Semi",    matches: [["BR","EN"]] },
  { key: "final",   label: "Final",   matches: [["BR","?"]] },
];

export default function BracketPeek({ focus = "oitavas" }: { focus?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 2px 6px", flexShrink: 0 }}>
      {COLS.map((col) => {
        const on = col.key === focus;
        return (
          <div key={col.key} style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 10, minWidth: 96 }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 11, letterSpacing: 1, color: on ? "var(--primary-strong)" : "var(--ink-3)", textTransform: "uppercase" }}>
              {col.label}
            </div>
            {col.matches.map((mt, i) => (
              <div key={i} style={{
                border: on ? "1.4px solid var(--primary-strong)" : "1px solid var(--line-strong)",
                background: on ? "var(--primary-soft)" : "var(--surface)",
                borderRadius: 10, padding: "7px 8px", display: "flex", flexDirection: "column", gap: 6,
              }}>
                {mt.map((c, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Flag code={c} size={17} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: c === "?" ? "var(--ink-3)" : "var(--ink)" }}>{c}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
