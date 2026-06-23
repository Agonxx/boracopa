"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Segmented from "@/components/ui/Segmented";
import { useAuthStore } from "@/store/auth";
import { useBolaoStore } from "@/store/bolao";
import { createClient } from "@/lib/supabase/client";
import { Trophy } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import UserPredictionsModal from "@/components/ui/UserPredictionsModal";

interface RankEntry {
  pos: number; name: string; pts: number; cravadas: number; init: string; you: boolean; user_id: string;
}

const RANK_FILTERS = ["Geral", "Fase de grupos", "Mata-mata"];

function RankAvatar({ init, size = 36, you, onClick }: { init: string; size?: number; you?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: you ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)" : "var(--app-bg)", border: you ? "none" : "1.5px solid var(--line-strong)", display: "grid", placeItems: "center", color: you ? "var(--on-primary)" : "var(--ink-2)", fontFamily: "Anton, sans-serif", fontSize: size * 0.4, letterSpacing: 0.3, cursor: onClick ? "pointer" : "default" }}
    >
      {init}
    </div>
  );
}

function PodiumCol({ r, place, onAvatarClick }: { r: RankEntry; place: 1 | 2 | 3; onAvatarClick: (r: RankEntry) => void }) {
  const heights: Record<number, number> = { 1: 96, 2: 74, 3: 62 };
  const sizes: Record<number, number> = { 1: 60, 2: 50, 3: 50 };
  const isFirst = place === 1;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ position: "relative" }}>
        <RankAvatar init={r.init} size={sizes[place]} you={r.you} onClick={() => onAvatarClick(r)} />
        <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 22, height: 22, borderRadius: "50%", background: isFirst ? "var(--primary)" : "var(--ink)", color: isFirst ? "var(--on-primary)" : "var(--surface)", border: "2px solid var(--app-bg)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: 12 }}>{place}</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 2 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>{r.name.split(" ")[0]}</div>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: "var(--primary-strong)" }}>{r.pts}</div>
      </div>
      <div style={{ width: "100%", height: heights[place], borderRadius: "12px 12px 0 0", background: isFirst ? "linear-gradient(180deg, var(--primary-soft), var(--surface))" : "var(--surface)", border: "1px solid var(--line-strong)", borderBottom: "none" }} />
    </div>
  );
}

function RankRow({ r, onAvatarClick }: { r: RankEntry; onAvatarClick: (r: RankEntry) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderRadius: 14, background: r.you ? "var(--primary)" : "var(--surface)", border: r.you ? "none" : "1px solid var(--line)", boxShadow: r.you ? "0 6px 16px -8px var(--primary-strong)" : "0 1px 2px rgba(26,24,20,.03)", color: r.you ? "var(--on-primary)" : "var(--ink)" }}>
      <span style={{ width: 22, textAlign: "center", fontFamily: "Anton, sans-serif", fontSize: 17, color: r.you ? "var(--on-primary)" : "var(--ink-3)" }}>{r.pos}</span>
      <RankAvatar init={r.init} size={34} you={r.you} onClick={() => onAvatarClick(r)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {r.name}{r.you && <span style={{ opacity: 0.85, fontWeight: 600 }}> · você</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 18 }}>{r.pts}</span>
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>pts</span>
      </div>
    </div>
  );
}

function DeskRow({ r, onAvatarClick }: { r: RankEntry; onAvatarClick: (r: RankEntry) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 110px 110px", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14, background: r.you ? "var(--primary)" : "var(--surface)", border: r.you ? "none" : "1px solid var(--line)", color: r.you ? "var(--on-primary)" : "var(--ink)", boxShadow: r.you ? "0 8px 20px -10px var(--primary-strong)" : "0 1px 2px rgba(26,24,20,.03)" }}>
      <span style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: r.you ? "var(--on-primary)" : r.pos <= 3 ? "var(--primary-strong)" : "var(--ink-3)", textAlign: "center" }}>{r.pos}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <RankAvatar init={r.init} size={34} you={r.you} onClick={() => onAvatarClick(r)} />
        <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {r.name}{r.you && <span style={{ opacity: 0.85, fontWeight: 600 }}> · você</span>}
        </span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, textAlign: "center" }}>{r.cravadas}</span>
      <div style={{ textAlign: "right", display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 20 }}>{r.pts}</span>
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>pts</span>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const { user } = useAuthStore();
  const { activeBolaoId, activeBolaoName } = useBolaoStore();
  const router = useRouter();
  const supabase = createClient();
  const [filter, setFilter] = useState("Geral");
  const [rank, setRank] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [predUser, setPredUser] = useState<{ id: string; name: string } | null>(null);
  function openPredUser(r: RankEntry) { setPredUser({ id: r.user_id, name: r.name }); }

  const fetchRanking = useCallback(async () => {
    if (!activeBolaoId || !user) { setLoading(false); return; }
    setLoading(true);

    const { data: memberRows } = await supabase
      .from("bolao_members")
      .select("user_id, pts, cravadas")
      .eq("bolao_id", activeBolaoId);

    if (!memberRows || memberRows.length === 0) { setRank([]); setLoading(false); return; }

    const userIds = memberRows.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    let ptsByUser: Record<string, { pts: number; cravadas: number }> = {};

    if (filter === "Geral") {
      for (const m of memberRows) ptsByUser[m.user_id] = { pts: m.pts ?? 0, cravadas: m.cravadas ?? 0 };
    } else {
      const phaseFilter = filter === "Fase de grupos"
        ? ["groups"]
        : ["r16", "quarter", "semi", "final"];

      const { data: finishedMatches } = await supabase
        .from("matches")
        .select("id, result_a, result_b")
        .eq("status", "finished")
        .in("phase", phaseFilter);

      if (finishedMatches && finishedMatches.length > 0) {
        const matchIds = finishedMatches.map((m) => m.id);
        const resultMap = Object.fromEntries(
          finishedMatches.map((m) => [m.id, { ra: m.result_a, rb: m.result_b }])
        );
        const { data: preds } = await supabase
          .from("predictions")
          .select("user_id, match_id, score_a, score_b")
          .in("user_id", userIds)
          .in("match_id", matchIds)
          .limit(10000);

        for (const p of preds ?? []) {
          const r = resultMap[p.match_id];
          if (!r || r.ra === null || r.rb === null) continue;
          const cravada = p.score_a === r.ra && p.score_b === r.rb;
          const win = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0);
          const acerto = win(p.score_a, p.score_b) === win(r.ra, r.rb);
          const pts = cravada ? 5 : acerto ? 3 : 0;
          if (!ptsByUser[p.user_id]) ptsByUser[p.user_id] = { pts: 0, cravadas: 0 };
          ptsByUser[p.user_id].pts += pts;
          if (cravada) ptsByUser[p.user_id].cravadas += 1;
        }
      }
      for (const uid of userIds) {
        if (!ptsByUser[uid]) ptsByUser[uid] = { pts: 0, cravadas: 0 };
      }
    }

    const entries: RankEntry[] = (profiles ?? [])
      .map((p) => {
        const data = ptsByUser[p.id] ?? { pts: 0, cravadas: 0 };
        return {
          pos: 0,
          user_id: p.id,
          name: p.name,
          pts: data.pts,
          cravadas: data.cravadas,
          init: p.name.slice(0, 2).toUpperCase(),
          you: p.id === user.id,
        };
      })
      .sort((a, b) => b.pts - a.pts || b.cravadas - a.cravadas || (a.you ? -1 : 1))
      .map((e, i) => ({ ...e, pos: i + 1 }));

    setRank(entries);
    setLoading(false);
  }, [activeBolaoId, filter, user?.id]);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  if (!user) return null;

  const me = rank.find((r) => r.you);
  const top3 = rank.slice(0, 3);
  const rest = rank.slice(3);
  const caption = `${activeBolaoName ?? "Bolão"} · ${rank.length} participante${rank.length !== 1 ? "s" : ""}`;

  /* sem bolão ativo */
  if (!activeBolaoId) return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto" style={{ textAlign: "center", paddingTop: 60 }}>
      <Trophy size={40} style={{ color: "var(--ink-3)", margin: "0 auto 16px" }} strokeWidth={1.5} />
      <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>Nenhum bolão ativo</h2>
      <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 24 }}>Selecione um bolão no topo ou crie/entre em um para ver o ranking.</p>
      <button onClick={() => router.push("/boloes")} style={{ height: 48, padding: "0 24px", borderRadius: 12, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 0 var(--primary-strong)" }}>
        Meus bolões →
      </button>
    </div>
  );

  const isDesktop = window !== undefined && window.innerWidth >= 1024;

  return (
    <div style={{
      padding: isDesktop ? "26px 30px 40px" : "14px 16px 16px",
      maxWidth: 900, margin: "0 auto",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* título */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: isDesktop ? 28 : 21, letterSpacing: 0.4, color: "var(--ink)" }}>
          {isDesktop ? "RANKING" : "Ranking"}
        </h2>
        <span style={{ marginLeft: "auto", fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4, background: "var(--primary-soft)", color: "var(--primary-strong)", borderRadius: 7, padding: "3px 8px" }}>
          {filter.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: -8, fontWeight: 500 }}>{caption}</div>

      <div>
        <Segmented items={RANK_FILTERS} value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 13px", border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
              <Skeleton w={22} h={22} radius={4} />
              <Skeleton w={36} h={36} radius="50%" />
              <Skeleton w="50%" h={16} radius={6} />
              <div style={{ marginLeft: "auto" }}><Skeleton w={44} h={22} radius={6} /></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* pódio */}
          {top3.length >= 3 && (
            <div style={{ display: isDesktop ? "flex" : "block", gap: 20, alignItems: "stretch" }}>
              <div style={{ width: isDesktop ? 320 : "100%", flexShrink: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "20px 20px 0", marginBottom: isDesktop ? 0 : 14 }}>
                {isDesktop && <div style={{ fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 14 }}>Pódio</div>}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <PodiumCol r={top3[1]} place={2} onAvatarClick={openPredUser} />
                  <PodiumCol r={top3[0]} place={1} onAvatarClick={openPredUser} />
                  <PodiumCol r={top3[2]} place={3} onAvatarClick={openPredUser} />
                </div>
              </div>
              {isDesktop && me && (
                <div style={{ flex: 1, minWidth: 0, background: "var(--hero-bg)", color: "var(--hero-ink)", borderRadius: 20, padding: "22px 24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: "repeating-linear-gradient(115deg, transparent 0 28px, var(--hero-stripe) 28px 29px)", pointerEvents: "none" }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1, color: "var(--hero-dim)", textTransform: "uppercase" }}>Sua posição · {activeBolaoName}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                      <span style={{ fontFamily: "Anton, sans-serif", fontSize: 56, lineHeight: 0.9 }}>#{me.pos}</span>
                      <span style={{ fontSize: 15, color: "var(--hero-dim)" }}>de {rank.length} · <b style={{ color: "var(--hero-ink)" }}>{me.pts} pts</b></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* lista */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isDesktop && rank.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 110px 110px", gap: 10, padding: "0 16px 2px", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--ink-3)" }}>
                <span style={{ textAlign: "center" }}>#</span><span>Participante</span>
                <span style={{ textAlign: "center" }}>Cravadas</span>
                <span style={{ textAlign: "right" }}>Pontos</span>
              </div>
            )}
            {isDesktop
              ? rank.map((r) => <DeskRow key={r.user_id} r={r} onAvatarClick={openPredUser} />)
              : rank.slice(top3.length >= 3 ? 3 : 0).map((r) => <RankRow key={r.user_id} r={r} onAvatarClick={openPredUser} />)
            }
            {rank.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum participante ainda.</p>}
          </div>
        </>
      )}

      {predUser && (
        <UserPredictionsModal userId={predUser.id} userName={predUser.name} onClose={() => setPredUser(null)} />
      )}

      {/* barra "sua posição" mobile */}
      {!isDesktop && me && (
        <div style={{ position: "sticky", bottom: 60, left: 0, right: 0, padding: "10px 0", borderTop: "1px solid var(--line)", background: "var(--surface)", margin: "0 -16px -20px" }}>
          <div style={{ padding: "0 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "Anton, sans-serif", fontSize: 16, color: "var(--primary-strong)" }}>#{me.pos}</span>
            <RankAvatar init={me.init} size={30} you />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Sua posição</div>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "Anton, sans-serif" }}>{me.pts} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
