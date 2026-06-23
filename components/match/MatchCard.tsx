"use client";

import { useState } from "react";
import Flag from "./Flag";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import type { Match } from "@/lib/mock";
import { useBolaoStore } from "@/store/bolao";

interface PredRow {
  score_a: number; score_b: number;
  profiles: { name: string } | null;
}

const chevBtn: React.CSSProperties = { border: "none", background: "transparent", cursor: "pointer", padding: 2, display: "grid", placeItems: "center" };
const stepBtn: React.CSSProperties = { width: 36, height: 44, border: "none", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" };
const teamName: React.CSSProperties = { fontWeight: 700, fontSize: 16, color: "var(--ink)", letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const chip: React.CSSProperties = { fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 0.4, color: "var(--ink)", background: "var(--app-bg)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "3px 8px", lineHeight: 1, whiteSpace: "nowrap", flexShrink: 0 };
const statusChip: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 20, border: "1px solid var(--line-strong)", whiteSpace: "nowrap" };

/* ── Score box vertical (desktop) ── */
function ScoreBox({ value, onChange, locked, sz = 46 }: { value: number | null; onChange: (v: number) => void; locked?: boolean; sz?: number }) {
  const set = value != null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {!locked && (
        <button onClick={() => onChange((value ?? 0) + 1)} style={chevBtn}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M6 14l6-6 6 6" /></svg>
        </button>
      )}
      <div style={{ width: sz, height: sz + 6, borderRadius: 12, background: set ? "var(--primary)" : "var(--app-bg)", color: set ? "var(--on-primary)" : "var(--ink-3)", border: set ? "1.6px solid var(--primary-strong)" : "1.6px dashed var(--line-strong)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: sz * 0.64, lineHeight: 1, boxShadow: set ? "0 4px 0 var(--primary-strong)" : "none", transition: "all .12s" }}>
        {set ? value : "–"}
      </div>
      {!locked && (
        <button onClick={() => onChange(Math.max(0, (value ?? 1) - 1))} style={chevBtn}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M6 10l6 6 6-6" /></svg>
        </button>
      )}
    </div>
  );
}

/* ── Score stepper horizontal (mobile) ── */
function ScoreStepperH({ value, onChange, locked }: { value: number | null; onChange: (v: number) => void; locked?: boolean }) {
  if (locked) {
    return <div style={{ width: 46, height: 44, borderRadius: 11, background: "var(--ink)", color: "var(--surface)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: 26 }}>{value}</div>;
  }
  const set = value != null;
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1.6px solid var(--line-strong)", borderRadius: 12, overflow: "hidden", background: "var(--surface)", flexShrink: 0 }}>
      <button onClick={() => onChange(Math.max(0, (value ?? 1) - 1))} style={stepBtn}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
      </button>
      <div style={{ width: 46, height: 44, display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: 26, lineHeight: 1, background: set ? "var(--primary)" : "transparent", color: set ? "var(--on-primary)" : "var(--ink-3)", borderLeft: "1.6px solid var(--line-strong)", borderRight: "1.6px solid var(--line-strong)" }}>
        {set ? value : "–"}
      </div>
      <button onClick={() => onChange((value ?? 0) + 1)} style={stepBtn}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  );
}

function TeamRow({ t, value, onChange, locked }: { t: Team; value: number | null; onChange: (v: number) => void; locked?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <Flag code={t.c} size={32} />
      <span style={{ ...teamName, flex: 1, fontSize: 14.5 }}>{t.n}</span>
      <ScoreStepperH value={value} onChange={onChange} locked={locked} />
    </div>
  );
}

type Team = { n: string; c: string };

/* ── Advance selector (knockout tie) ── */
function AdvanceSelector({ a, b, value, onChange }: { a: Team; b: Team; value: string | null; onChange: (v: string) => void }) {
  const opt = (t: Team) => {
    const on = value === t.c;
    return (
      <button key={t.c} onClick={() => onChange(t.c)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 6px",
        borderRadius: 30, cursor: "pointer",
        border: on ? "1.6px solid var(--primary-strong)" : "1px solid var(--line-strong)",
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-strong)" : "var(--ink-2)",
        fontWeight: 700, fontSize: 12.5,
      }}>
        <Flag code={t.c} size={18} /> {t.n}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--app-bg)", borderRadius: 13, padding: "10px 11px", border: "1.4px dashed var(--line-strong)" }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--live)", display: "inline-block" }} />
        Empate — quem avança nos pênaltis?
      </span>
      <div style={{ display: "flex", gap: 8 }}>{opt(a)}{opt(b)}</div>
    </div>
  );
}

function calcResultType(pred: [number, number], result: [number, number]): "cravada" | "acerto" | "errou" {
  if (pred[0] === result[0] && pred[1] === result[1]) return "cravada";
  const win = (a: number, b: number) => a > b ? 1 : a < b ? -1 : 0;
  if (win(pred[0], pred[1]) === win(result[0], result[1])) return "acerto";
  return "errou";
}

const RESULT_STYLE = {
  cravada: { bg: "var(--primary-soft)", color: "var(--primary-strong)", label: "Cravada", pts: "+5 pts" },
  acerto:  { bg: "#e8f5e9", color: "#2e7d32",            label: "Acerto",  pts: "+3 pts" },
  errou:   { bg: "var(--app-bg)", color: "var(--ink-3)", label: "Errou",   pts: "0 pts"  },
};

export default function MatchCard({ m, compact, knockout, onSave }: { m: Match; compact?: boolean; knockout?: boolean; onSave?: (a: number, b: number) => void }) {
  const [a, setA] = useState<number | null>(m.score[0]);
  const [b, setB] = useState<number | null>(m.score[1]);
  const [adv, setAdv] = useState<string | null>(m.advance || null);
  const [confirmed, setConfirmed] = useState(
    m.done || (m.score[0] != null && m.score[1] != null)
  );
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const { activeBolaoId } = useBolaoStore();
  const [showPreds, setShowPreds] = useState(false);
  const [preds, setPreds] = useState<PredRow[]>([]);
  const [predsLoading, setPredsLoading] = useState(false);

  function handleA(v: number) { setA(v); setConfirmed(false); }
  function handleB(v: number) { setB(v); setConfirmed(false); }

  async function handleConfirm() {
    if (a == null || b == null || !onSave) return;
    setSaving(true);
    await onSave(a, b);
    setSaving(false);
    setConfirmed(true);
  }

  async function openPreds() {
    setShowPreds(true);
    if (preds.length > 0) return;
    setPredsLoading(true);

    // Busca user_ids do bolão ativo para filtrar
    const memberIds: string[] = [];
    if (activeBolaoId) {
      const { data: members } = await supabase
        .from("bolao_members")
        .select("user_id")
        .eq("bolao_id", activeBolaoId);
      memberIds.push(...(members ?? []).map((mb: any) => mb.user_id));
    }

    const query = supabase
      .from("predictions")
      .select("score_a, score_b, profiles(name)")
      .eq("match_id", String(m.id));

    if (memberIds.length > 0) query.in("user_id", memberIds);

    const { data } = await query;
    let rows = (data ?? []) as unknown as PredRow[];

    if (m.finished && m.score[0] != null && m.score[1] != null) {
      const pts = { cravada: 5, acerto: 3, errou: 0 };
      rows = [...rows].sort((ra, rb) => {
        const diff = pts[calcResultType([rb.score_a, rb.score_b], [m.score[0]!, m.score[1]!])] -
                     pts[calcResultType([ra.score_a, ra.score_b], [m.score[0]!, m.score[1]!])];
        if (diff !== 0) return diff;
        return (ra.profiles?.name ?? "").localeCompare(rb.profiles?.name ?? "", "pt-BR");
      });
    } else {
      rows = [...rows].sort((ra, rb) =>
        (ra.profiles?.name ?? "").localeCompare(rb.profiles?.name ?? "", "pt-BR")
      );
    }

    setPreds(rows);
    setPredsLoading(false);
  }
  const filled = a != null && b != null;
  const tie = filled && a === b;
  const urgent = m.deadline?.urgent;
  const locked = m.done;
  const sz = 40;
  // hasPred = usuário realmente palpitou (badge "palpitado" só acende aqui)
  const hasPred = m.finished
    ? (m.myPred?.[0] != null && m.myPred?.[1] != null)
    : (m.score[0] != null && m.score[1] != null);
  const isLive = !m.finished && !!m.matchDate &&
    new Date(m.matchDate) <= new Date() &&
    (Date.now() - new Date(m.matchDate).getTime()) < 115 * 60 * 1000;

  /* ── Upcoming card ── */
  if (m.upcoming) {
    return (
      <div style={{ background: "var(--surface)", borderRadius: 18, padding: "13px 16px", border: "1px dashed var(--line-strong)", display: "flex", flexDirection: "column", gap: 10, opacity: 0.78, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={chip}>{m.grp}</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>{m.time}</span>
          <span style={{ ...statusChip, marginLeft: "auto", color: "var(--ink-3)" }}>abre depois</span>
        </div>
        {[m.a, m.b].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Flag code={t.c} size={28} />
            <span style={{ ...teamName, flex: 1, fontSize: 14.5 }}>{t.n}</span>
            <span style={{ fontFamily: "Anton, sans-serif", fontSize: 22, color: "var(--ink-3)" }}>–</span>
          </div>
        ))}
      </div>
    );
  }

  return (
  <>
    <div style={{
      background: "var(--surface)", borderRadius: 20, padding: "14px 16px 16px",
      border: tie && knockout && !locked ? "1.5px solid var(--primary-strong)" : "1px solid var(--line)",
      boxShadow: "0 1px 2px rgba(26,24,20,.04), 0 8px 24px -16px rgba(26,24,20,.4)",
      display: "flex", flexDirection: "column", gap: 12, flexShrink: 0, opacity: locked ? 0.92 : 1,
    }}>
      {/* meta */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={chip}>{m.grp}</span>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>{m.time}</span>
        <span style={{ marginLeft: "auto" }}>
          {isLive
            ? <span style={{ ...statusChip, color: "#dc2626", background: "#fef2f2", borderColor: "transparent", animation: "live-pulse 1.4s ease infinite" }}>● AO VIVO</span>
            : (hasPred || (!locked && confirmed))
              ? <span style={{ ...statusChip, color: "var(--primary-strong)", borderColor: "transparent", background: "var(--primary-soft)" }}>✓ palpitado</span>
              : urgent
                ? <span style={{ ...statusChip, color: "#7a3b00", background: "var(--live-soft)", borderColor: "transparent" }}>fecha em {m.deadline?.label}</span>
                : <span style={{ ...statusChip, color: "var(--ink-2)" }}>fecha {m.deadline?.label}</span>}
        </span>
      </div>

      {/* times + placar */}
      {compact ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TeamRow t={m.a} value={a} onChange={handleA} locked={locked} />
          <TeamRow t={m.b} value={b} onChange={handleB} locked={locked} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Flag code={m.a.c} size={28} /><span style={{ ...teamName, fontSize: 15 }}>{m.a.n}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {locked
              ? <>{[a, b].map((v, i) => <div key={i} style={{ width: sz, height: sz + 6, borderRadius: 12, background: "var(--ink)", color: "var(--surface)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: sz * 0.64, lineHeight: 1 }}>{v}</div>)}</>
              : <><ScoreBox value={a} onChange={handleA} sz={sz} /><span style={{ fontFamily: "Anton, sans-serif", fontSize: 20, color: "var(--ink-3)" }}>:</span><ScoreBox value={b} onChange={handleB} sz={sz} /></>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
            <span style={{ ...teamName, fontSize: 15, textAlign: "right" }}>{m.b.n}</span><Flag code={m.b.c} size={28} />
          </div>
        </div>
      )}

      {/* knockout tie → advance selector */}
      {knockout && !locked && tie && (
        <AdvanceSelector a={m.a} b={m.b} value={adv} onChange={setAdv} />
      )}

      {/* footer */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {!locked && filled && !confirmed && (
          <button onClick={handleConfirm} disabled={saving} style={{
            width: "100%", height: 40, borderRadius: 10, border: "none",
            background: saving ? "var(--primary-soft)" : "var(--primary)",
            color: saving ? "var(--primary-strong)" : "var(--on-primary)",
            fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 14,
            cursor: saving ? "default" : "pointer",
            boxShadow: saving ? "none" : "0 3px 0 var(--primary-strong)",
            transition: "all .12s",
          }}>
            {saving ? "Salvando..." : "Confirmar palpite →"}
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {m.finished ? (
            m.myPred && m.myPred[0] != null && m.myPred[1] != null && m.score[0] != null && m.score[1] != null ? (
              (() => {
                const tipo = calcResultType([m.myPred[0]!, m.myPred[1]!], [m.score[0]!, m.score[1]!]);
                const st = RESULT_STYLE[tipo];
                return (
                  <>
                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                      Seu palpite: <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.myPred[0]} × {m.myPred[1]}</b>
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 800, background: st.bg, color: st.color, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>
                      {st.label} {st.pts}
                    </span>
                  </>
                );
              })()
            ) : (
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Sem palpite neste jogo</span>
            )
          ) : locked ? (
            <>
              <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Palpite encerrado</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)", fontWeight: 600, flexShrink: 0 }}>+3 acerto · +5 cravada</span>
            </>
          ) : confirmed ? (
            <span style={{ fontSize: 12, color: "var(--primary-strong)", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--primary-strong)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-10" /></svg>
              Palpite confirmado · <button onClick={() => setConfirmed(false)} style={{ background: "none", border: "none", color: "var(--ink-2)", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "Archivo, sans-serif", fontWeight: 600 }}>editar</button>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)", fontWeight: 600, flexShrink: 0 }}>+3 acerto · +5 cravada</span>
            </span>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                {filled ? "Revise e confirme o palpite" : "Defina o placar para palpitar"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>+3 acerto · +5 cravada</span>
            </>
          )}
        </div>

        {locked && (
          <button onClick={openPreds} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 12, fontWeight: 700, color: "var(--primary-strong)",
            fontFamily: "Archivo, sans-serif", alignSelf: "flex-start",
          }}>
            ▼ Ver palpites
          </button>
        )}
      </div>
    </div>

    {showPreds && (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 16 }}>
        <div onClick={() => setShowPreds(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,14,.55)" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--app-bg)", borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
          {/* cabeçalho do modal */}
          <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={chip}>{m.grp}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>{m.time}</span>
              <button onClick={() => setShowPreds(false)} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <X size={14} strokeWidth={2.2} style={{ color: "var(--ink-2)" }} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                <Flag code={m.a.c} size={22} />
                <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.a.n}</span>
              </div>
              <span style={{ fontFamily: "Anton, sans-serif", fontSize: 20, color: m.finished ? "var(--ink)" : "var(--ink-3)", flexShrink: 0, padding: "0 6px" }}>
                {m.finished && m.score[0] != null ? `${m.score[0]} × ${m.score[1]}` : "vs"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
                <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{m.b.n}</span>
                <Flag code={m.b.c} size={22} />
              </div>
            </div>
          </div>
          {/* lista de palpites */}
          <div style={{ overflowY: "auto", padding: "12px 14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            {predsLoading ? (
              <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>Carregando...</p>
            ) : preds.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>Nenhum palpite registrado.</p>
            ) : preds.map((p, i) => {
              const name = p.profiles?.name ?? "Usuário";
              let badge = null;
              if (m.finished && m.score[0] != null && m.score[1] != null) {
                const tipo = calcResultType([p.score_a, p.score_b], [m.score[0]!, m.score[1]!]);
                const st = RESULT_STYLE[tipo];
                badge = (
                  <span style={{ fontSize: 11, fontWeight: 800, background: st.bg, color: st.color, borderRadius: 20, padding: "3px 9px", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {st.label} {st.pts}
                  </span>
                );
              }
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "var(--primary-soft)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: 11, color: "var(--primary-strong)" }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{p.score_a} × {p.score_b}</span>
                  {badge}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </>
  );
}
