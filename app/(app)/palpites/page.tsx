"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import MatchCard from "@/components/match/MatchCard";
import Segmented from "@/components/ui/Segmented";
import ScoringNote from "@/components/match/ScoringNote";
import Skeleton from "@/components/ui/Skeleton";
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
  { key: "r32",     label: "16-avos", title: "16 avos de final",  chipPrefix: "16-avo",  phases: ["r32"] },
  { key: "r16",     label: "Oitavas", title: "Oitavas de final",  chipPrefix: "Oitava",  phases: ["r16"] },
  { key: "quarter", label: "Quartas", title: "Quartas de final",  chipPrefix: "Quarta",  phases: ["quarter"] },
  { key: "semi",    label: "Semi",    title: "Semifinal",          chipPrefix: "Semi",    phases: ["semi"] },
  { key: "final",   label: "Final",   title: "Final",              chipPrefix: null,      phases: ["third", "final"] },
] as const;

const PHASE_TABS_ALL = [
  { key: "grupos",    label: "Fase de grupos" },
  { key: "matamata",  label: "Mata-mata" },
  { key: "pordata",   label: "Por data" },
];

const PHASE_LABELS: Record<string, string> = {
  r32: "16-avos", r16: "Oitavas", quarter: "Quartas", semi: "Semifinal",
  third: "3° Lugar", final: "Final",
};

interface DbMatch {
  id: string; phase: string; group_name: string | null; round: number | null;
  team_a: string; team_b: string; code_a: string; code_b: string;
  match_date: string; status: string; result_a: number | null; result_b: number | null;
}

interface Prediction {
  match_id: string; score_a: number; score_b: number;
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
    advance: undefined,
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

/* ── KO Timeline ── */
type KORound = (typeof KO_ROUNDS)[number];

function KOTimeline({ matches, value, onChange }: {
  matches: DbMatch[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: 18, padding: "16px 20px", overflowX: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: 380 }}>
        {KO_ROUNDS.map((r, i) => {
          const rMatches = matches.filter(m => (r.phases as readonly string[]).includes(m.phase));
          const completed = rMatches.length > 0 && rMatches.every(m => m.status === "finished");
          const active = !completed && rMatches.some(m => m.status !== "upcoming" && m.status !== "");
          const openCount = rMatches.filter(m => m.status === "open").length;
          const isSelected = r.key === value;

          const prevR = i > 0 ? KO_ROUNDS[i - 1] : null;
          const prevCompleted = prevR
            ? matches.filter(m => (prevR.phases as readonly string[]).includes(m.phase))
              .every(m => m.status === "finished") &&
              matches.some(m => (prevR.phases as readonly string[]).includes(m.phase))
            : false;
          const prevHasAny = prevR
            ? matches.some(m => (prevR.phases as readonly string[]).includes(m.phase))
            : false;
          const prevActive = prevR && !prevCompleted && matches.some(m =>
            (prevR.phases as readonly string[]).includes(m.phase) && m.status !== "upcoming"
          );

          return (
            <Fragment key={r.key}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: 2, marginTop: 17, alignSelf: "flex-start",
                  background: (prevCompleted || prevActive) ? "var(--primary)" : "var(--line-strong)",
                  transition: "background .2s",
                }} />
              )}
              <button
                onClick={() => onChange(r.key)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "grid", placeItems: "center",
                  background: completed ? "var(--ink)" : active ? "var(--primary)" : "var(--app-bg)",
                  border: completed ? "none" : active ? "2.5px solid var(--primary-strong)" : "2px solid var(--line-strong)",
                  boxShadow: isSelected ? `0 0 0 3px ${completed ? "rgba(26,24,20,.12)" : "var(--primary-soft)"}` : "none",
                  transition: "box-shadow .15s",
                  flexShrink: 0,
                }}>
                  {completed ? (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4 10-10" />
                    </svg>
                  ) : active ? (
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-3)" }}>
                      {rMatches.length > 0 ? rMatches.length : ""}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "var(--ink)" : "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {r.label}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: completed ? "var(--primary-strong)" : "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {completed
                    ? `${rMatches.length}/${rMatches.length}`
                    : active
                      ? openCount > 0 ? `${openCount} em aberto` : "em andamento"
                      : "aguarda"}
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function PalpitesPage() {
  const { user } = useAuthStore();
  const isDesktop = useIsDesktop();
  const supabase = createClient();

  const [phase, setPhase] = useState("pordata");
  const [pendingOnly, setPendingOnly] = useState(false);
  const phaseTabs = PHASE_TABS_ALL;
  const [group, setGroup] = useState("A");
  const [round, setRound] = useState<string | null>(null);
  const [matches, setMatches] = useState<DbMatch[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from("matches").select("*").order("match_date"),
      supabase.from("predictions").select("match_id,score_a,score_b").eq("user_id", user.id),
    ]);
    setMatches((matchData as DbMatch[]) ?? []);
    setPredictions((predData as Prediction[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset round selection when leaving mata-mata (so auto-select fires again on re-entry)
  useEffect(() => {
    if (phase !== "matamata") setRound(null);
  }, [phase]);

  useEffect(() => {
    if (phase !== "pordata" || loading) return;
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    setTimeout(() => {
      const el = document.querySelector(`[data-date="${key}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [phase, loading]);

  // Auto-select first KO round with open matches
  const autoRound = useMemo(() => {
    const firstActive = KO_ROUNDS.find(r =>
      matches.some(m => (r.phases as readonly string[]).includes(m.phase) && m.status === "open")
    );
    if (firstActive) return firstActive.key;
    const firstWithMatches = KO_ROUNDS.find(r =>
      matches.some(m => (r.phases as readonly string[]).includes(m.phase))
    );
    return firstWithMatches?.key ?? "r32";
  }, [matches]);

  const effectiveRound = round ?? autoRound;

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

  const activeKORound = KO_ROUNDS.find(r => r.key === effectiveRound);

  const rawVisible = isDate
    ? []
    : isKO
      ? matches.filter(m => (activeKORound?.phases as readonly string[] ?? []).includes(m.phase))
      : matches.filter(m => m.phase === "groups" && m.group_name === group);

  const visibleMatches = isKO
    ? [...rawVisible].sort((a, b) => a.match_date.localeCompare(b.match_date))
    : rawVisible;

  const cardMatches = visibleMatches.map((m, idx) => {
    const base = toCardMatch(m, predMap[m.id]);
    if (!isKO || !activeKORound) return base;
    let grp: string;
    if (activeKORound.chipPrefix) {
      grp = `${activeKORound.chipPrefix} ${idx + 1}`;
    } else {
      grp = m.phase === "third" ? "3° Lugar" : "Final";
    }
    return { ...base, grp };
  });

  const open = cardMatches.filter(m => !m.done && !m.upcoming).length;
  const dateGroups = isDate ? buildDateGroups(matches, predMap) : [];
  const filteredDateGroups = pendingOnly
    ? dateGroups.map(g => ({ ...g, items: g.items.filter(m => m.status === "open" && !predMap[m.id]) })).filter(g => g.items.length > 0)
    : dateGroups;

  // KO section header data
  const koPredCount = visibleMatches.filter(m => predMap[m.id]).length;
  const koTotal = visibleMatches.length;
  const nextOpen = [...visibleMatches]
    .filter(m => m.status === "open")
    .sort((a, b) => a.match_date.localeCompare(b.match_date))[0];

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

      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        margin: isDesktop ? "0 -30px" : "0 -16px",
        padding: isDesktop ? "10px 30px 10px" : "8px 16px 8px",
        background: "color-mix(in srgb, var(--app-bg) 90%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
        display: "flex", flexDirection: "column", gap: 8,
      } as React.CSSProperties}>
        <Segmented items={phaseTabs} value={phase} onChange={setPhase} />
        {isDate && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setPendingOnly(v => !v)} style={{
              height: 30, padding: "0 14px", borderRadius: 20, cursor: "pointer",
              border: `1.5px solid ${pendingOnly ? "var(--primary-strong)" : "var(--line-strong)"}`,
              background: pendingOnly ? "var(--primary-soft)" : "var(--surface)",
              color: pendingOnly ? "var(--primary-strong)" : "var(--ink-3)",
              fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5,
            }}>
              {pendingOnly ? "✓ Só pendentes" : "Só pendentes"}
            </button>
          </div>
        )}
      </div>

      {isDate ? (
        <>
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
          <KOTimeline matches={matches} value={effectiveRound} onChange={setRound} />

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontFamily: "Anton, sans-serif", fontSize: isDesktop ? 26 : 20, letterSpacing: 0.3, color: "var(--ink)" }}>
                {activeKORound?.title ?? "Mata-mata"}
              </h2>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>
                {koTotal} jogo{koTotal !== 1 ? "s" : ""}
                {nextOpen && ` · fecha ${formatMatchTime(nextOpen.match_date)}`}
              </span>
            </div>
            {koTotal > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-strong)" }}>
                  {koPredCount}/{koTotal} palpitados
                </span>
                <div style={{ width: 100, height: 5, borderRadius: 10, background: "var(--line-strong)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${koTotal > 0 ? (koPredCount / koTotal) * 100 : 0}%`,
                    background: "var(--primary)", borderRadius: 10, transition: "width .3s",
                  }} />
                </div>
              </div>
            )}
          </div>

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
                <MatchCard key={m.id} m={m} compact={!isDesktop}
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
