"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MatchCard from "@/components/match/MatchCard";
import Segmented from "@/components/ui/Segmented";
import ScoringNote from "@/components/match/ScoringNote";
import BracketPeek from "@/components/match/BracketPeek";
import { useAuthStore } from "@/store/auth";
import { GROUPS, GROUP_KEYS, KO, KO_ROUNDS } from "@/lib/mock";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

const PHASE_TABS = [
  { key: "grupos", label: "Fase de grupos" },
  { key: "matamata", label: "Mata-mata" },
];

const chip: React.CSSProperties = {
  fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4,
  background: "var(--primary-soft)", color: "var(--primary-strong)",
  borderRadius: 7, padding: "3px 8px", lineHeight: 1, whiteSpace: "nowrap",
};

export default function PalpitesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const [phase, setPhase] = useState("grupos");
  const [group, setGroup] = useState("C");
  const [round, setRound] = useState("oitavas");

  if (!user) return null;

  const isKO = phase === "matamata";
  const groupList = GROUPS[group] ?? GROUPS.A;
  const koList = KO[round] ?? [];
  const open = groupList.filter((m) => !m.done && !m.upcoming).length;

  return (
    <div style={{
      padding: isDesktop ? "26px 30px 40px" : "14px 16px 20px",
      maxWidth: 900,
      margin: "0 auto",
      display: "flex", flexDirection: "column", gap: isDesktop ? 18 : 14,
    }}>

      {/* título */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: isDesktop ? 28 : 21, letterSpacing: 0.4, color: "var(--ink)" }}>
          {isDesktop ? "PALPITES" : "Palpites"}
        </h2>
        <span style={{ ...chip, marginLeft: "auto" }}>
          {isKO ? "MATA-MATA" : "FASE DE GRUPOS"}
        </span>
      </div>

      {/* switch de fase */}
      <div>
        <Segmented items={PHASE_TABS} value={phase} onChange={setPhase} />
      </div>

      {!isKO ? (
        <>
          {!isDesktop && (
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, marginTop: -6 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
          )}

          {/* seletor de grupos */}
          <div>
            <Segmented items={GROUP_KEYS} value={group} onChange={setGroup} />
          </div>

          {isDesktop && (
            <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: -8 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
          )}

          {/* cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: isDesktop ? 16 : 12,
            alignItems: "start",
          }}>
            {groupList.map((m) => (
              <MatchCard key={m.id} m={m} compact={!isDesktop} />
            ))}
          </div>

          <ScoringNote />
        </>
      ) : (
        <>
          {/* bracket */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: isDesktop ? 18 : 14, padding: isDesktop ? "16px 18px" : "12px 14px",
          }}>
            {isDesktop && (
              <div style={{ fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 10 }}>
                Chaveamento
              </div>
            )}
            {!isDesktop && (
              <span style={{ fontFamily: "Anton, sans-serif", fontSize: 11, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Chaveamento · deslize →
              </span>
            )}
            <BracketPeek focus={round} />
          </div>

          {/* seletor de rodadas */}
          <div>
            <Segmented items={KO_ROUNDS} value={round} onChange={setRound} scroll />
          </div>

          {/* cards knockout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: isDesktop ? 16 : 12,
            alignItems: "start",
          }}>
            {koList.map((m) => (
              <MatchCard key={m.id} m={m} compact={!isDesktop} knockout />
            ))}
            {koList.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-3)", gridColumn: "1 / -1" }}>
                Sem partidas nesta fase ainda.
              </p>
            )}
          </div>

          <ScoringNote />
        </>
      )}
    </div>
  );
}
