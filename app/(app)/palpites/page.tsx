"use client";

import { useState } from "react";
import MatchCard from "@/components/match/MatchCard";
import Segmented from "@/components/ui/Segmented";
import ScoringNote from "@/components/match/ScoringNote";
import BracketPeek from "@/components/match/BracketPeek";
import PointsPill from "@/components/ui/PointsPill";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { GROUPS, GROUP_KEYS, KO, KO_ROUNDS } from "@/lib/mock";

const chip: React.CSSProperties = { fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4, color: "var(--ink)", background: "var(--app-bg)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "3px 8px", lineHeight: 1, whiteSpace: "nowrap" };
const sectionTitle: React.CSSProperties = { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 21, letterSpacing: 0.4, color: "var(--ink)" };

const PHASE_TABS = [{ key: "grupos", label: "Fase de grupos" }, { key: "matamata", label: "Mata-mata" }];

export default function PalpitesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [phase, setPhase] = useState("grupos");
  const [group, setGroup] = useState("C");
  const [round, setRound] = useState("oitavas");

  if (!user) return null;
  const initials = user.name.slice(0, 2).toUpperCase();
  const isKO = phase === "matamata";
  const groupList = GROUPS[group] ?? GROUPS.A;
  const koList = KO[round] ?? [];
  const open = groupList.filter((m) => !m.done && !m.upcoming).length;

  return (
    <>
      {/* ── Mobile ── */}
      <div className="lg:hidden" style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* título + chip de fase */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <h2 style={sectionTitle}>Palpites</h2>
          <span style={{ ...chip, marginLeft: "auto", background: "var(--primary-soft)", borderColor: "transparent", color: "var(--primary-strong)" }}>
            {isKO ? "MATA-MATA" : "FASE DE GRUPOS"}
          </span>
        </div>

        {/* switch de fase (mobile) */}
        <Segmented items={PHASE_TABS} value={phase} onChange={setPhase} />

        {!isKO ? (
          <>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, marginTop: -4 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
            <Segmented items={GROUP_KEYS} value={group} onChange={setGroup} scroll />
            {groupList.map((m) => <MatchCard key={m.id} m={m} compact />)}
            <ScoringNote />
          </>
        ) : (
          <>
            <Segmented items={KO_ROUNDS} value={round} onChange={setRound} scroll />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "Anton, sans-serif", fontSize: 11, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase" }}>
                Chaveamento · deslize →
              </span>
              <BracketPeek focus={round} />
            </div>
            {koList.map((m) => <MatchCard key={m.id} m={m} compact knockout />)}
            <ScoringNote />
          </>
        )}
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block" style={{ padding: "26px 30px 40px" }}>
        {/* desktop header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 30, letterSpacing: 0.3, lineHeight: 1 }}>PALPITES</h1>
          <span style={{ ...chip, background: "var(--primary-soft)", borderColor: "transparent", color: "var(--primary-strong)" }}>
            {isKO ? "MATA-MATA" : "FASE DE GRUPOS"}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <PointsPill pts={user.pts} initials={initials} showAvatar={false} />
            <Avatar size={42} initials={initials} ring onClick={() => router.push("/perfil")} />
          </div>
        </div>

        {/* switch de fase */}
        <div style={{ maxWidth: 320, marginBottom: 18 }}>
          <Segmented items={PHASE_TABS} value={phase} onChange={setPhase} />
        </div>

        {!isKO ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ maxWidth: 460 }}>
              <Segmented items={GROUP_KEYS} value={group} onChange={setGroup} scroll />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
              {groupList.map((m) => <MatchCard key={m.id} m={m} />)}
            </div>
            <div style={{ maxWidth: 360 }}><ScoringNote /></div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, padding: "16px 18px" }}>
              <div style={{ fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 10 }}>
                Chaveamento
              </div>
              <BracketPeek focus={round} />
            </div>
            <div style={{ maxWidth: 360 }}>
              <Segmented items={KO_ROUNDS} value={round} onChange={setRound} scroll />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
              {koList.map((m) => <MatchCard key={m.id} m={m} knockout />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
