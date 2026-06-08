"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import MatchCard from "@/components/match/MatchCard";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import type { Match } from "@/lib/mock";

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

interface DbMatch {
  id: string; phase: string; group_name: string | null; round: number | null;
  team_a: string; team_b: string; code_a: string; code_b: string;
  match_date: string; status: string; result_a: number | null; result_b: number | null;
}

interface Prediction {
  match_id: string; score_a: number; score_b: number; advance_code?: string | null;
}

const PHASE_LABELS: Record<string, string> = {
  r16: "Oitavas", quarter: "Quartas", semi: "Semifinal", final: "Final",
};

function formatMatchTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const t = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Hoje ${t}`;
  const tom = new Date(now); tom.setDate(now.getDate() + 1);
  if (d.toDateString() === tom.toDateString()) return `Amanhã ${t}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ${t}`;
}

function toCardMatch(m: DbMatch, pred?: Prediction): Match {
  const locked = m.status === "closed" || m.status === "finished";
  return {
    id: m.id,
    grp: m.group_name ? `Rod. ${m.round}` : (PHASE_LABELS[m.phase] ?? m.phase),
    time: formatMatchTime(m.match_date),
    a: { n: m.team_a, c: m.code_a },
    b: { n: m.team_b, c: m.code_b },
    score: [pred?.score_a ?? null, pred?.score_b ?? null] as [number | null, number | null],
    done: locked,
    upcoming: m.status === "upcoming",
    advance: pred?.advance_code ?? undefined,
    deadline: undefined,
    editUntil: undefined,
  };
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
  const supabase = createClient();

  const [matches, setMatches] = useState<DbMatch[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .in("status", ["open", "upcoming"])
      .order("match_date")
      .limit(6);

    const ms = (matchData as DbMatch[]) ?? [];
    setMatches(ms);

    if (ms.length > 0) {
      const { data: predData } = await supabase
        .from("predictions")
        .select("match_id, score_a, score_b, advance_code")
        .eq("user_id", user.id)
        .in("match_id", ms.map((m) => m.id));
      setPredictions((predData as Prediction[]) ?? []);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function savePrediction(matchId: string, scoreA: number, scoreB: number) {
    if (!user) return;
    await supabase.from("predictions").upsert(
      { user_id: user.id, match_id: matchId, score_a: scoreA, score_b: scoreB },
      { onConflict: "user_id,match_id" }
    );
    setPredictions((prev) => {
      const exists = prev.find((p) => p.match_id === matchId);
      if (exists) return prev.map((p) => p.match_id === matchId ? { ...p, score_a: scoreA, score_b: scoreB } : p);
      return [...prev, { match_id: matchId, score_a: scoreA, score_b: scoreB }];
    });
  }

  if (!user) return null;

  const firstName = user.name.split(" ")[0].toUpperCase();
  const predMap = Object.fromEntries(predictions.map((p) => [p.match_id, p]));
  const cardMatches = matches.map((m) => toCardMatch(m, predMap[m.id]));

  // Hero data
  const firstOpen = matches.find((m) => m.status === "open");
  const firstAny = matches[0];
  const heroTarget = firstOpen ?? firstAny;
  const openCount = matches.filter((m) => m.status === "open").length;
  const phaseLabel = heroTarget
    ? heroTarget.group_name
      ? `GRUPO ${heroTarget.group_name}`
      : (PHASE_LABELS[heroTarget.phase] ?? heroTarget.phase).toUpperCase()
    : "";

  // Section label
  const sectionSub = firstAny?.group_name
    ? `Rodada ${firstAny.round} · Grupos`
    : firstAny?.phase ? PHASE_LABELS[firstAny.phase] : "";

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

      <Hero
        wide={isDesktop}
        open={openCount}
        targetDate={heroTarget?.match_date ?? null}
        phaseLabel={phaseLabel}
      />

      {!loading && cardMatches.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 style={sectionTitle}>Próximos jogos</h2>
            {sectionSub && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginLeft: "auto" }}>
                {sectionSub}
              </span>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: isDesktop ? 16 : 12,
            alignItems: "start",
          }}>
            {cardMatches.map((m) => (
              <MatchCard
                key={m.id}
                m={m}
                compact={!isDesktop}
                onSave={(a, b) => savePrediction(m.id as string, a, b)}
              />
            ))}
          </div>

          <Link href="/palpites" style={ghostBtn}>Ver rodada completa →</Link>
        </>
      )}

      {!loading && cardMatches.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-2)", fontSize: 14 }}>
          Nenhuma partida em aberto no momento.
        </div>
      )}
    </div>
  );
}
