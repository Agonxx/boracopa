"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function useCountdown(seconds: number) {
  const [t, setT] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return [h, m, s];
}

function Seg({ v }: { v: string }) {
  return <span style={{ fontSize: 52, color: "var(--hero-ink)", fontVariantNumeric: "tabular-nums" }}>{v}</span>;
}
function Colon() {
  return <span style={{ fontSize: 42, color: "var(--hero-dim)", padding: "0 2px", position: "relative", top: -2 }}>:</span>;
}

export default function Hero({ wide = false, open = 3 }: { wide?: boolean; open?: number }) {
  const [h, m, s] = useCountdown(2 * 3600 + 10 * 60 + 42);

  return (
    <div style={{
      background: "var(--hero-bg)", color: "var(--hero-ink)", borderRadius: 22,
      padding: wide ? "24px 28px" : "18px 18px 20px", position: "relative", overflow: "hidden",
      boxShadow: "0 18px 40px -24px rgba(0,0,0,.6)", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: "repeating-linear-gradient(115deg, transparent 0 26px, var(--hero-stripe) 26px 27px)", pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: wide ? "row" : "column", gap: wide ? 28 : 16, alignItems: wide ? "center" : "stretch" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--live)", boxShadow: "0 0 0 3px var(--live-soft)" }} />
            <span style={{ fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 1.5, color: "var(--hero-dim)" }}>PRÓXIMO PRAZO · GRUPO C</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, fontFamily: "Anton, sans-serif", lineHeight: 0.85 }}>
            <Seg v={h} /><Colon /><Seg v={m} /><Colon /><Seg v={s} />
          </div>
          <div style={{ fontSize: 13.5, color: "var(--hero-dim)", marginTop: 10, fontWeight: 500 }}>
            até o Brasil entrar em campo. Você tem{" "}
            <b style={{ color: "var(--hero-ink)" }}>{open} jogos</b> em aberto nesta rodada.
          </div>
        </div>
        <Link href="/palpites" style={{
          background: "var(--primary)", color: "var(--on-primary)", border: "none",
          borderRadius: 14, padding: wide ? "16px 26px" : "14px",
          fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15.5,
          letterSpacing: 0.2, cursor: "pointer", boxShadow: "0 5px 0 var(--primary-strong)",
          whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          textDecoration: "none",
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="var(--on-primary)" stroke="none">
            <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
          </svg>
          Palpitar agora
        </Link>
      </div>
    </div>
  );
}
