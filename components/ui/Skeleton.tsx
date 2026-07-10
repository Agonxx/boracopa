export default function Skeleton({
  w = "100%", h = 18, radius = 8,
}: {
  w?: number | string; h?: number | string; radius?: number | string;
}) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "var(--line-strong)",
      position: "relative", overflow: "hidden", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent 0%, var(--surface) 50%, transparent 100%)",
        animation: "sk 1.3s ease infinite",
      }} />
    </div>
  );
}
