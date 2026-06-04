export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl tracking-wide uppercase leading-none ${className}`}>
      <span style={{ color: "var(--ink)" }}>BORA</span>
      <span style={{ color: "var(--primary-strong)" }}>COPA</span>
    </span>
  );
}
