export default function Flag({ code, size = 34 }: { code: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "repeating-linear-gradient(135deg, var(--flag-a) 0 6px, var(--flag-b) 6px 12px)",
      border: "1.5px solid var(--line-strong)",
      display: "grid", placeItems: "center",
      fontFamily: "Anton, sans-serif", fontSize: size * 0.36, color: "var(--ink)",
      letterSpacing: 0.5, boxShadow: "inset 0 0 0 3px var(--surface)",
    }}>
      {code}
    </div>
  );
}
