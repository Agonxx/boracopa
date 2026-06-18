"use client";

import { useState, useEffect, useCallback } from "react";
import MatchCard from "@/components/match/MatchCard";
import Segmented from "@/components/ui/Segmented";
import ScoringNote from "@/components/match/ScoringNote";
import Skeleton from "@/components/ui/Skeleton";
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

const GROUP_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const KO_ROUNDS = [
  { key: "oitavas", label: "Oitavas" },
  { key: "quartas", label: "Quartas" },
  { key: "semi", label: "Semifinal" },
  { key: "final", label: "Final" },
];
const PHASE_TABS_ALL = [
  { key: "grupos", label: "Fase de grupos" },
  { key: "matamata", label: "Mata-mata" },
  { key: "pordata", label: "Por data" },
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

function buildDateGroups(allMatches: DbMatch[], predMap: Record<string, Prediction>) {
  const groups: Map<string, { label: string; items: DbMatch[] }> = new Map();
  for (const m of [...allMatches].sort((a, b) => a.match_date.localeCompare(b.match_date))) {
    const d = new Date(m.match_date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups.has(key)) {
      const raw = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      groups.set(key, { label: raw.charAt(0).toUpperCase() + raw.slice(1), items: [] });
    }
    groups.get(key)!.items.push(m);
  }
  return [...groups.values()];
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
  const started = new Date(m.match_date) <= new Date();
  const locked = m.status === "closed" || finished || started;
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
    finished,
    myPred: finished ? [pred?.score_a ?? null, pred?.score_b ?? null] as [number | null, number | null] : undefined,
    matchDate: m.match_date,
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

  const [phase, setPhase] = useState("pordata");
  const [pendingOnly, setPendingOnly] = useState(false);
  const phaseTabs = user?.isSuperAdmin ? PHASE_TABS_ALL : [PHASE_TABS_ALL[0], PHASE_TABS_ALL[2]];
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

  useEffect(() => {
    if (phase !== "pordata" || loading) return;
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    setTimeout(() => {
      const el = document.querySelector(`[data-date="${key}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [phase, loading]);

  async function savePrediction(matchId: string, scoreA: number, scoreB: number) {
    if (!user) return;
    const match = matches.find((m) => m.id === matchId);
    if (!match || new Date(match.match_date) <= new Date()) return;
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
  const isDate = phase === "pordata";
  const predMap = Object.fromEntries(predictions.map(p => [p.match_id, p]));

  const visibleMatches = isDate
    ? []
    : isKO
      ? matches.filter(m => m.phase === KO_DB_PHASE[round])
      : matches.filter(m => m.phase === "groups" && m.group_name === group);

  const cardMatches = visibleMatches.map(m => toCardMatch(m, predMap[m.id]));
  const open = cardMatches.filter(m => !m.done && !m.upcoming).length;
  const dateGroups = isDate ? buildDateGroups(matches, predMap) : [];
  const filteredDateGroups = pendingOnly
    ? dateGroups.map(g => ({ ...g, items: g.items.filter(m => m.status === "open" && !predMap[m.id]) })).filter(g => g.items.length > 0)
    : dateGroups;

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
          {isDate ? "72 JOGOS" : isKO ? "MATA-MATA" : "FASE DE GRUPOS"}
        </span>
      </div>

      <div><Segmented items={phaseTabs} value={phase} onChange={setPhase} /></div>

      {isDate ? (
        <>
          {/* filtro pendentes */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setPendingOnly(v => !v)} style={{
              height: 32, padding: "0 14px", borderRadius: 20, cursor: "pointer",
              border: `1.5px solid ${pendingOnly ? "var(--primary-strong)" : "var(--line-strong)"}`,
              background: pendingOnly ? "var(--primary-soft)" : "var(--surface)",
              color: pendingOnly ? "var(--primary-strong)" : "var(--ink-3)",
              fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5,
            }}>
              {pendingOnly ? "✓ Só pendentes" : "Só pendentes"}
            </button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 16 : 12 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: "var(--surface)", borderRadius: 20, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 8 }}><Skeleton w={60} h={24} /><Skeleton w={100} h={24} /></div>
                  <Skeleton h={44} radius={10} /><Skeleton h={44} radius={10} />
                </div>
              ))}
            </div>
          ) : filteredDateGroups.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>
              {pendingOnly ? "Nenhum jogo pendente. Todos os palpites em dia! 🎉" : "Nenhuma partida cadastrada."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {filteredDateGroups.map(({ label, items }, gi) => {
                const today = new Date();
                const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
                const d = new Date(items[0].match_date);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                return (
                  <div key={label} data-date={key} style={{ display: "flex", flexDirection: "column", gap: isDesktop ? 14 : 10 }}>
                    <div style={{ fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.8, color: key === todayKey ? "var(--primary-strong)" : "var(--ink-3)", textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px solid ${key === todayKey ? "var(--primary-strong)" : "var(--line)"}` }}>
                      {label} · {items.length} jogo{items.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 16 : 12, alignItems: "start" }}>
                      {items.map(m => {
                        const cm = toCardMatch(m, predMap[m.id]);
                        return (
                          <MatchCard key={cm.id} m={cm} compact={!isDesktop}
                            onSave={(a, b) => savePrediction(m.id, a, b)} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <ScoringNote />
        </>
      ) : !isKO ? (
        <>
          {!isDesktop && (
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, marginTop: -6 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
          )}

          <div><Segmented items={GROUP_KEYS} value={group} onChange={setGroup} scroll={!isDesktop} /></div>

          {isDesktop && (
            <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: -8 }}>
              Grupo {group} · <b style={{ color: "var(--ink)" }}>{open} jogo{open !== 1 ? "s" : ""}</b> em aberto
            </div>
          )}

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 16 : 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: "var(--surface)", borderRadius: 20, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 8 }}><Skeleton w={60} h={24} /><Skeleton w={100} h={24} /></div>
                  <Skeleton h={44} radius={10} /><Skeleton h={44} radius={10} />
                </div>
              ))}
            </div>
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
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 16 : 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: "var(--surface)", borderRadius: 20, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 8 }}><Skeleton w={60} h={24} /><Skeleton w={100} h={24} /></div>
                  <Skeleton h={44} radius={10} /><Skeleton h={44} radius={10} />
                </div>
              ))}
            </div>
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
