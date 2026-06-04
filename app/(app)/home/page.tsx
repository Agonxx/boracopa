"use client";

import Link from "next/link";
import Hero from "@/components/home/Hero";
import MatchCard from "@/components/match/MatchCard";
import PointsPill from "@/components/ui/PointsPill";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { MATCHES } from "@/lib/mock";

const sectionTitle: React.CSSProperties = {
  margin: 0, fontFamily: "Anton, sans-serif", fontSize: 21, letterSpacing: 0.4, color: "var(--ink)",
};
const ghostBtn: React.CSSProperties = {
  width: "100%", marginTop: 4, padding: "13px", borderRadius: 13, cursor: "pointer", flexShrink: 0,
  background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink)",
  fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14,
};

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  if (!user) return null;

  const initials = user.name.slice(0, 2).toUpperCase();
  const firstName = user.name.split(" ")[0].toUpperCase();

  return (
    <>
      {/* ── Mobile ── */}
      <div className="lg:hidden" style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Hero open={3} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
          <h2 style={sectionTitle}>Próximos jogos</h2>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginLeft: "auto" }}>Rodada 2 · Grupos</span>
        </div>
        {MATCHES.map((m) => <MatchCard key={m.id} m={m} compact />)}
        <Link href="/palpites" style={{ ...ghostBtn, textAlign: "center", display: "block", textDecoration: "none" }}>
          Ver rodada completa
        </Link>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block" style={{ padding: "26px 30px 40px" }}>
        {/* desktop header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>Boa tarde,</div>
            <h1 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 30, letterSpacing: 0.3, lineHeight: 1 }}>
              {firstName}, BORA PALPITAR
            </h1>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <PointsPill pts={user.pts} initials={initials} showAvatar={false} />
            <Avatar size={42} initials={initials} ring onClick={() => router.push("/perfil")} />
          </div>
        </div>

        <Hero wide open={3} />

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "26px 0 14px" }}>
          <h2 style={sectionTitle}>Próximos jogos</h2>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginLeft: "auto" }}>Rodada 2 · Fase de grupos</span>
          <Link href="/palpites" style={{ ...ghostBtn, width: "auto", padding: "8px 16px", marginTop: 0, textDecoration: "none", display: "inline-block" }}>
            Ver rodada completa
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {MATCHES.map((m) => <MatchCard key={m.id} m={m} />)}
        </div>
      </div>
    </>
  );
}
