"use client";

import { useState } from "react";
import Segmented from "@/components/ui/Segmented";
import PointsPill from "@/components/ui/PointsPill";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { RANK, RANK_FILTERS, RANK_CAPTIONS, type RankEntry } from "@/lib/mock";

const ME = RANK.find((r) => r.you)!;

/* ── Avatar no ranking ── */
function RankAvatar({ init, size = 36, you }: { init: string; size?: number; you?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: you ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)" : "var(--app-bg)",
      border: you ? "none" : "1.5px solid var(--line-strong)",
      display: "grid", placeItems: "center",
      color: you ? "var(--on-primary)" : "var(--ink-2)",
      fontFamily: "Anton, sans-serif", fontSize: size * 0.4, letterSpacing: 0.3,
    }}>{init}</div>
  );
}

/* ── Pódio ── */
function PodiumCol({ r, place }: { r: RankEntry; place: 1 | 2 | 3 }) {
  const heights: Record<number, number> = { 1: 96, 2: 74, 3: 62 };
  const sizes: Record<number, number> = { 1: 60, 2: 50, 3: 50 };
  const isFirst = place === 1;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ position: "relative" }}>
        <RankAvatar init={r.init} size={sizes[place]} you={r.you} />
        <div style={{
          position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
          width: 22, height: 22, borderRadius: "50%",
          background: isFirst ? "var(--primary)" : "var(--ink)",
          color: isFirst ? "var(--on-primary)" : "var(--surface)",
          border: "2px solid var(--app-bg)", display: "grid", placeItems: "center",
          fontFamily: "Anton, sans-serif", fontSize: 12,
        }}>{place}</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 2 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>{r.name.split(" ")[0]}</div>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: "var(--primary-strong)" }}>{r.pts}</div>
      </div>
      <div style={{
        width: "100%", height: heights[place], borderRadius: "12px 12px 0 0",
        background: isFirst ? "linear-gradient(180deg, var(--primary-soft), var(--surface))" : "var(--surface)",
        border: "1px solid var(--line-strong)", borderBottom: "none",
      }} />
    </div>
  );
}

function Podium() {
  const [first, second, third] = RANK;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
      <PodiumCol r={second} place={2} />
      <PodiumCol r={first} place={1} />
      <PodiumCol r={third} place={3} />
    </div>
  );
}

/* ── Linha do ranking (mobile) ── */
function RankRow({ r, showSector }: { r: RankEntry; showSector?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderRadius: 14,
      background: r.you ? "var(--primary)" : "var(--surface)",
      border: r.you ? "none" : "1px solid var(--line)",
      boxShadow: r.you ? "0 6px 16px -8px var(--primary-strong)" : "0 1px 2px rgba(26,24,20,.03)",
      color: r.you ? "var(--on-primary)" : "var(--ink)",
    }}>
      <span style={{ width: 22, textAlign: "center", fontFamily: "Anton, sans-serif", fontSize: 17, color: r.you ? "var(--on-primary)" : "var(--ink-3)" }}>{r.pos}</span>
      <RankAvatar init={r.init} size={34} you={r.you} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {r.name}{r.you && <span style={{ opacity: 0.85, fontWeight: 600 }}> · você</span>}
        </div>
        {showSector && <div style={{ fontSize: 11.5, fontWeight: 600, color: r.you ? "rgba(255,255,255,.7)" : "var(--ink-3)" }}>{r.sector}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 18 }}>{r.pts}</span>
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>pts</span>
      </div>
    </div>
  );
}

/* ── Linha desktop ── */
function DeskRow({ r }: { r: RankEntry }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "48px 1fr 160px 110px 110px", alignItems: "center", gap: 10,
      padding: "12px 16px", borderRadius: 14,
      background: r.you ? "var(--primary)" : "var(--surface)",
      border: r.you ? "none" : "1px solid var(--line)",
      color: r.you ? "var(--on-primary)" : "var(--ink)",
      boxShadow: r.you ? "0 8px 20px -10px var(--primary-strong)" : "0 1px 2px rgba(26,24,20,.03)",
    }}>
      <span style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: r.you ? "var(--on-primary)" : r.pos <= 3 ? "var(--primary-strong)" : "var(--ink-3)", textAlign: "center" }}>{r.pos}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <RankAvatar init={r.init} size={34} you={r.you} />
        <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: r.you ? "var(--on-primary)" : "var(--ink)" }}>
          {r.name}{r.you && <span style={{ opacity: 0.85, fontWeight: 600 }}> · você</span>}
        </span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: r.you ? "rgba(255,255,255,.8)" : "var(--ink-2)" }}>{r.sector}</span>
      <span style={{ fontSize: 14, fontWeight: 700, textAlign: "center", color: r.you ? "var(--on-primary)" : "var(--ink)" }}>{r.cravadas}</span>
      <div style={{ textAlign: "right", display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 20 }}>{r.pts}</span>
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>pts</span>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [filter, setFilter] = useState("Geral");
  if (!user) return null;

  const initials = user.name.slice(0, 2).toUpperCase();
  const rest = RANK.slice(3);

  return (
    <>
      {/* ── Mobile ── */}
      <div className="lg:hidden" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 21, letterSpacing: 0.4, color: "var(--ink)" }}>Ranking</h2>
            <span style={{ marginLeft: "auto", fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4, background: "var(--primary-soft)", borderColor: "transparent", color: "var(--primary-strong)", borderRadius: 7, padding: "3px 8px" }}>
              {filter.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: -8, fontWeight: 500 }}>{RANK_CAPTIONS[filter]}</div>
          <Segmented items={RANK_FILTERS} value={filter} onChange={setFilter} />
          <Podium />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rest.map((r) => <RankRow key={r.pos} r={r} showSector={filter === "Por setor"} />)}
          </div>
        </div>

        {/* barra fixa "sua posição" */}
        <div style={{ padding: "10px 16px 24px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "Anton, sans-serif", fontSize: 16, color: "var(--primary-strong)" }}>#{ME.pos}</span>
            <RankAvatar init={ME.init} size={30} you />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Sua posição</div>
            <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>+12 pra <b style={{ color: "var(--ink)" }}>top 3</b></span>
          </div>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block" style={{ padding: "26px 30px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 30, letterSpacing: 0.3, lineHeight: 1 }}>RANKING</h1>
          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4, background: "var(--primary-soft)", color: "var(--primary-strong)", borderRadius: 7, padding: "3px 8px" }}>
            {filter.toUpperCase()}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <PointsPill pts={user.pts} initials={initials} showAvatar={false} />
            <Avatar size={42} initials={initials} ring onClick={() => router.push("/perfil")} />
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 18 }}>{RANK_CAPTIONS[filter]}</div>

        {/* pódio + sua posição */}
        <div style={{ display: "flex", gap: 20, alignItems: "stretch", marginBottom: 22 }}>
          <div style={{ width: 320, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "20px 20px 0" }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 14 }}>Pódio</div>
            <Podium />
          </div>
          <div style={{ flex: 1, minWidth: 0, background: "var(--hero-bg)", color: "var(--hero-ink)", borderRadius: 20, padding: "22px 24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: "repeating-linear-gradient(115deg, transparent 0 28px, var(--hero-stripe) 28px 29px)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1, color: "var(--hero-dim)", textTransform: "uppercase" }}>Sua posição</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                <span style={{ fontFamily: "Anton, sans-serif", fontSize: 56, lineHeight: 0.9 }}>#{ME.pos}</span>
                <span style={{ fontSize: 15, color: "var(--hero-dim)" }}>de 32 · <b style={{ color: "var(--hero-ink)" }}>{ME.pts} pts</b></span>
              </div>
              <div style={{ display: "flex", gap: 28, marginTop: 20 }}>
                {([[ME.cravadas, "cravadas"], ["+12", "pra top 3"], ["71%", "aproveitamento"]] as const).map(([v, k]) => (
                  <div key={k}>
                    <div style={{ fontFamily: "Anton, sans-serif", fontSize: 24, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 11.5, color: "var(--hero-dim)", fontWeight: 600, marginTop: 3 }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* tabela */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ maxWidth: 320, marginBottom: 4 }}>
            <Segmented items={RANK_FILTERS} value={filter} onChange={setFilter} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 160px 110px 110px", gap: 10, padding: "0 16px 2px", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--ink-3)" }}>
            <span style={{ textAlign: "center" }}>#</span>
            <span>Participante</span>
            <span>Setor</span>
            <span style={{ textAlign: "center" }}>Cravadas</span>
            <span style={{ textAlign: "right" }}>Pontos</span>
          </div>
          {RANK.map((r) => <DeskRow key={r.pos} r={r} />)}
        </div>
      </div>
    </>
  );
}
