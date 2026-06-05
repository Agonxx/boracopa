"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import MatchCard from "@/components/match/MatchCard";
import { useAuthStore } from "@/store/auth";
import { MATCHES } from "@/lib/mock";

function useIsDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return v;
}

const sectionTitle: React.CSSProperties = {
  margin: 0, fontFamily: "Anton, sans-serif", fontSize: 21, letterSpacing: 0.4, color: "var(--ink)",
};
const ghostBtn: React.CSSProperties = {
  width: "100%", marginTop: 4, padding: "13px", borderRadius: 13, cursor: "pointer", flexShrink: 0,
  background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink)",
  fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, textAlign: "center",
  display: "block", textDecoration: "none",
};

export default function HomePage() {
  const { user } = useAuthStore();
  const isDesktop = useIsDesktop();
  if (!user) return null;

  const firstName = user.name.split(" ")[0].toUpperCase();

  return (
    <div style={{
      padding: isDesktop ? "26px 30px 40px" : "14px 16px 20px",
      maxWidth: 900, margin: "0 auto",
      display: "flex", flexDirection: "column", gap: isDesktop ? 22 : 16,
    }}>
      {isDesktop && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>Boa tarde,</div>
          <h1 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 28, letterSpacing: 0.3, lineHeight: 1 }}>
            {firstName}, BORA PALPITAR
          </h1>
        </div>
      )}

      <Hero wide={isDesktop} open={3} />

      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={sectionTitle}>Próximos jogos</h2>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginLeft: "auto" }}>Rodada 2 · Grupos</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
        gap: isDesktop ? 16 : 12,
        alignItems: "start",
      }}>
        {MATCHES.map((m) => <MatchCard key={m.id} m={m} compact={!isDesktop} />)}
      </div>

      <Link href="/palpites" style={ghostBtn}>Ver rodada completa</Link>
    </div>
  );
}
