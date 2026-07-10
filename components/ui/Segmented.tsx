"use client";

type Item = string | { key: string; label: string };

export default function Segmented({
  items, value, onChange, scroll,
}: {
  items: Item[];
  value: string;
  onChange: (v: string) => void;
  scroll?: boolean;
}) {
  return (
    <div style={{
      display: "flex", gap: 5, background: "var(--surface)",
      border: "1px solid var(--line-strong)", borderRadius: 14, padding: 5,
      overflowX: scroll ? "auto" : "visible", flexShrink: 0, width: "100%",
    }}>
      {items.map((it) => {
        const label = typeof it === "string" ? it : it.label;
        const key = typeof it === "string" ? it : it.key;
        const on = key === value;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              flex: scroll ? "0 0 auto" : 1, minWidth: scroll ? 44 : 0,
              padding: "8px 14px", borderRadius: 10, border: "none",
              cursor: "pointer", whiteSpace: "nowrap",
              background: on ? "var(--ink)" : "transparent",
              color: on ? "var(--surface)" : "var(--ink-2)",
              fontFamily: "Archivo, sans-serif", fontWeight: on ? 800 : 600,
              fontSize: 13.5, transition: "all .12s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
