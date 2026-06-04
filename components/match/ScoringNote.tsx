export default function ScoringNote() {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16,
      padding: "13px 15px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
    }}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="var(--primary-strong)" stroke="none">
        <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
      </svg>
      <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
        <b style={{ color: "var(--ink)", fontSize: 13 }}>Como pontua</b><br />
        Acertou vencedor/empate <b style={{ color: "var(--primary-strong)" }}>+3</b> · cravou o placar <b style={{ color: "var(--primary-strong)" }}>+5</b>
      </div>
    </div>
  );
}
