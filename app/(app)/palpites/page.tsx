"use client";

import { useState, useEffect, useCallback } from "react";
import MatchCard from "@/components/match/MatchCard";
import Segmented from "@/components/ui/Segmented";
import ScoringNote from "@/components/match/ScoringNote";
import BracketPeek from "@/components/match/BracketPeek";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import type { Match } from "@/lib/mock";

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

const GROUP_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const KO_ROUNDS = [
  { key: "oitavas", label: "Oitavas" },
  { key: "quartas", label: "Quartas" },
  { key: "semi", label: "Semifinal" },
  { key: "final", label: "Final" },
];
const PHASE_TABS = [
  { key: "grupos", label: "Fase de grupos" },
  { key: "matamata", label: "Mata-mata" },
];
const KO_DB_PHASE: Record<string, string> = {
  oitavas: "r16", quartas: "quarter", semi: "semi", final: "final",
};
const PHASE_LABELS: Record<string, string> = {
  r16: "Oitavas", quarter: "Quartas", semi: "Semifinal", final: "Final",
};

interface DbMatch {
  id: string; phase: string; group_name: string | null; round: number | null;
  team_a: string; team_b: string; code_a: string; code_b: string;
  match_date: string; status: string; result_a: number | null; result_b: number | null;
}

interface Prediction {
  match_id: string; score_a: number; score_b: number; advance_code?: string | null;
}

function formatMatchTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const t = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje ${t}`;
  const tom = new Date(now); tom.setDate(now.getDate() + 1);
  if (d.toDateString() === tom.toDateString()) return `Amanhã ${t}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ${t}`;
}

function computeDeadline(dateStr: string, status: string): { label: string; urgent: boolean } | undefined {
  if (status !== "open") return undefined;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs <= 0) return undefined;
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return { label: `${Math.floor(diffMs / 60000)}min`, urgent: true };
  if (diffH < 3) return { label: `em ${Math.floor(diffH)}h${Math.floor((diffH % 1) * 60)}min`, urgent: true };
  if (diffH < 24) return { label: `em ${Math.floor(diffH)}h`, urgent: false };
  return { label: formatMatchTime(dateStr), urgent: false };
}

function toCardMatch(m: DbMatch, pred?: Prediction) {
  const finished = m.status === "finished";
  const locked = m.status === "closed" || finished;
  return {
    id: m.id,
    grp: m.group_name ? `Rod. ${m.round}` : (PHASE_LABELS[m.phase] ?? m.phase),
    time: formatMatchTime(m.match_date),
    a: { n: m.team_a, c: m.code_a },
    b: { n: m.team_b, c: m.code_b },
    score: (finished ? [m.result_a, m.result_b] : [pred?.score_a ?? null, pred?.score_b ?? null]) as [number | null, number | null],
    done: locked,
    upcoming: m.status === "upcoming",
    advance: pred?.advance_code ?? undefined,
    deadline: computeDeadline(m.match_date, m.status),
    editUntil: finished ? "—" : undefined,
  };
}

const chip: React.CSSProperties = {
  fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4,
  background: "var(--primary-soft)", color: "var(--primary-strong)",
  borderRadius: 7, padding: "3px 8px", lineHeight: 1, whiteSpace: "nowrap",
};

export default function PalpitesPage() {
  const { user } = useAuthStore();
  const isDesktop = useIsDesktop();
  const supabase = createClient();

  const [phase, setPhase] = useState("grupos");
  const [group, setGroup] = useState("A");
  const [round, setRound] = useState("oitavas");
  const [matches, setMatches] = useState<DbMatch[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from("matches").select("*").order("match_date"),
      supabase.from("predictions").select("match_id,score_a,score_b,advance_code").eq("user_id", user.id),
    ]);
    setMatches((matchData as DbMatch[]) ?? []);
    setPredictions((predData as Prediction[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function savePrediction(matchId: string, scoreA: number, scoreB: number) {
    if (!user) return;
    await supabase.from("predictions").upsert(
      { user_id: user.id, match_id: matchId, score_a: scoreA, score_b: scoreB },
      { onConflict: "user_id,match_id" }
    );
    setPredictions(prev => {
      const exists = prev.find(p => p.match_id === matchId);
      if (exists) return prev.map(p => p.match_id === matchId ? { ...p, score_a: scoreA, score_b: scoreB } : p);
      return [...prev, { match_id: matchId, score_a: scoreA, score_b: scoreB }];
    });
  }

  if (!user) return null;

  const isKO = phase === "matamata";
  const predMap = Object.fromEntries(predictions.map(p => [p.match_id, p]));

  const visibleMatches = isKO
    ? matches.filter(m => m.phase === KO_DB_PHASE[round])
    : matches.filter(m => m.phase === "groups" && m.group_name === group);

  const cardMatches = visibleMatches.map(m => toCardMatch(m, predMap[m.id]));
  const open = cardMatches.filter(m => !m.done && !m.upcoming).length;

  return (
    <div style={{
      padding: isDesktop ? "26px 30px 40px" : "14px 16px 20px",
      maxWidth: 900, margin: "0 auto",
      display: "flex", flexDirection: "column", gap: isDesktop ? 18 : 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: isDesktop ? 28 : 21, letterSpacing: 0.4, color: "var(--ink)" }}>
          {isDesktop ? "PALPITES" : "Palpites"}
        </h2>
        <span style={{ ...chip, marginLeft: "auto" }}>
          {isKO ? "MATA-MATA" : "FASE DE GRUPOS"}
        </span>
      </div>

      <div><Segmented items={PHASE_TABS} value={phase} onChange={setPhase} /></div>

      {!isKO ? (
        <>
          {!isDesktop && (
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, marginTop: -6 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
          )}

          <div><Segmented items={GROUP_KEYS} value={group} onChange={setGroup} /></div>

          {isDesktop && (
            <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: -8 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
          )}

          {loading ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Carregando...</p>
          ) : cardMatches.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhuma partida cadastrada para o Grupo {group} ainda.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 16 : 12, alignItems: "start" }}>
              {cardMatches.map(m => (
                <MatchCard key={m.id} m={m} compact={!isDesktop}
                  onSave={(a, b) => savePrediction(m.id, a, b)} />
              ))}
            </div>
          )}

          <ScoringNote />
        </>
      ) : (
        <>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: isDesktop ? 18 : 14, padding: isDesktop ? "16px 18px" : "12px 14px",
          }}>
            {!isDesktop && (
              <span style={{ fontFamily: "Anton, sans-serif", fontSize: 11, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Chaveamento · deslize →
              </span>
            )}
            {isDesktop && (
              <div style={{ fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 10 }}>
                Chaveamento
              </div>
            )}
            <BracketPeek focus={round} />
          </div>

          <div><Segmented items={KO_ROUNDS} value={round} onChange={setRound} /></div>

          {loading ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Carregando...</p>
          ) : cardMatches.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Sem partidas nesta fase ainda.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 16 : 12, alignItems: "start" }}>
              {cardMatches.map(m => (
                <MatchCard key={m.id} m={m} compact={!isDesktop} knockout
                  onSave={(a, b) => savePrediction(m.id, a, b)} />
              ))}
            </div>
          )}

          <ScoringNote />
        </>
      )}
    </div>
  );
}
