"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Flag from "@/components/match/Flag";

interface PredItem {
  score_a: number;
  score_b: number;
  match: {
    team_a: string; team_b: string; code_a: string; code_b: string;
    result_a: number; result_b: number; match_date: string;
  };
}

function calcResult(pred: [number, number], result: [number, number]): "cravada" | "acerto" | "errou" {
  if (pred[0] === result[0] && pred[1] === result[1]) return "cravada";
  const w = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0);
  if (w(pred[0], pred[1]) === w(result[0], result[1])) return "acerto";
  return "errou";
}

const BADGE = {
  cravada: { label: "Cravada", pts: 5,  bg: "var(--primary-soft)",  color: "var(--primary-strong)" },
  acerto:  { label: "Acerto",  pts: 3,  bg: "#e8f5e9",              color: "#2e7d32"               },
  errou:   { label: "Errou",   pts: 0,  bg: "var(--app-bg)",        color: "var(--ink-3)"          },
};

export default function UserPredictionsModal({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<PredItem[]>([]);
  const [finishedCount, setFinishedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: predData }, { count }] = await Promise.all([
        supabase
          .from("predictions")
          .select("score_a, score_b, matches!inner(team_a, team_b, code_a, code_b, result_a, result_b, match_date)")
          .eq("user_id", userId)
          .eq("matches.status", "finished"),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "finished"),
      ]);

      const mapped = ((predData ?? []) as any[])
        .map((p) => ({ score_a: p.score_a, score_b: p.score_b, match: p.matches }))
        .filter((p) => p.match)
        .sort((a, b) => b.match.match_date.localeCompare(a.match.match_date));

      setItems(mapped);
      setFinishedCount(count ?? 0);
      setLoading(false);
    }
    load();
  }, [userId]);

  const earnedPts = items.reduce((acc, item) => {
    const tipo = calcResult([item.score_a, item.score_b], [item.match.result_a, item.match.result_b]);
    return acc + BADGE[tipo].pts;
  }, 0);

  const maxPts = finishedCount * 5;
  const aprov = maxPts > 0 ? `${Math.round((earnedPts / maxPts) * 100)}%` : "–";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,18,14,.55)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "var(--app-bg)", borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)", maxHeight: "84vh", display: "flex", flexDirection: "column" }}>
        {/* cabeçalho */}
        <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 16, letterSpacing: 0.3, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </p>
              {!loading && (
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
                  {items.length} palpite{items.length !== 1 ? "s" : ""} em jogos encerrados
                  · <b style={{ color: "var(--primary-strong)" }}>{earnedPts} pts</b>
                  · {aprov} aproveit.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* lista */}
        <div style={{ overflowY: "auto", padding: "12px 14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0", margin: 0 }}>
              Carregando...
            </p>
          ) : items.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0", margin: 0 }}>
              Nenhum palpite em jogo finalizado ainda.
            </p>
          ) : (
            items.map((item, i) => {
              const tipo = calcResult([item.score_a, item.score_b], [item.match.result_a, item.match.result_b]);
              const b = BADGE[tipo];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)" }}>
                  {/* times */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                    <Flag code={item.match.code_a} size={16} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60 }}>
                      {item.match.team_a}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 700, flexShrink: 0, padding: "0 2px", fontVariantNumeric: "tabular-nums" }}>
                      {item.match.result_a}×{item.match.result_b}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60 }}>
                      {item.match.team_b}
                    </span>
                    <Flag code={item.match.code_b} size={16} />
                  </div>
                  {/* palpite + badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {item.score_a}×{item.score_b}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, background: b.bg, color: b.color, borderRadius: 20, padding: "3px 9px", whiteSpace: "nowrap" }}>
                      {b.label} {b.pts > 0 ? `+${b.pts}` : "0"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
