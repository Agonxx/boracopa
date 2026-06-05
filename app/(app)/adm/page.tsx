"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";

interface Match {
  id: string; phase: string; group_name: string | null; round: number | null;
  team_a: string; team_b: string; code_a: string; code_b: string;
  match_date: string; status: string; result_a: number | null; result_b: number | null;
}

const PHASES = [
  { v: "groups",  l: "Fase de grupos" },
  { v: "r16",     l: "Oitavas de final" },
  { v: "quarter", l: "Quartas de final" },
  { v: "semi",    l: "Semifinal" },
  { v: "final",   l: "Final" },
];
const GROUPS = ["A","B","C","D","E","F","G","H"];
const STATUS_LABEL: Record<string, string> = {
  upcoming: "Em breve", open: "Aberto", closed: "Encerrado", finished: "Finalizado",
};
const STATUS_COLOR: Record<string, string> = {
  upcoming: "var(--ink-3)", open: "var(--primary-strong)", closed: "var(--live)", finished: "var(--ink-2)",
};

const fieldStyle: React.CSSProperties = { height: 44, padding: "0 12px", borderRadius: 10, border: "1.5px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontSize: 14, color: "var(--ink)", outline: "none", width: "100%" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-2)", display: "block", marginBottom: 5 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column" }}><span style={labelStyle}>{label}</span>{children}</label>;
}

export default function AdmPage() {
  const { user, _hydrated } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"partidas" | "resultados">("partidas");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // form — nova partida
  const [f, setF] = useState({ phase: "groups", group_name: "A", round: "1", team_a: "", team_b: "", code_a: "", code_b: "", match_date: "", status: "upcoming" });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // resultados
  const [resMatch, setResMatch] = useState<string>("");
  const [resA, setResA] = useState("");
  const [resB, setResB] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (_hydrated && (!user || !user.isSuperAdmin)) router.replace("/home");
  }, [user, _hydrated]);

  const fetchMatches = useCallback(async () => {
    const { data } = await supabase.from("matches").select("*").order("match_date");
    setMatches((data as Match[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  if (!_hydrated || !user?.isSuperAdmin) return null;

  async function handleAddMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!f.team_a || !f.team_b || !f.match_date) return;
    setSaving(true);
    const { error } = await supabase.from("matches").insert({
      phase: f.phase,
      group_name: f.phase === "groups" ? f.group_name : null,
      round: f.phase === "groups" ? parseInt(f.round) : null,
      team_a: f.team_a, team_b: f.team_b,
      code_a: f.code_a.toUpperCase(), code_b: f.code_b.toUpperCase(),
      match_date: f.match_date,
      status: f.status,
    });
    setSaving(false);
    if (!error) {
      setSavedMsg("Partida adicionada!");
      setF(prev => ({ ...prev, team_a: "", team_b: "", code_a: "", code_b: "", match_date: "" }));
      fetchMatches();
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }

  async function handleUpdateStatus(matchId: string, status: string) {
    await supabase.from("matches").update({ status }).eq("id", matchId);
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
  }

  async function handlePublishResult(e: React.FormEvent) {
    e.preventDefault();
    if (!resMatch || resA === "" || resB === "") return;
    setPublishing(true);
    await supabase.from("matches").update({
      result_a: parseInt(resA), result_b: parseInt(resB), status: "finished",
    }).eq("id", resMatch);
    setPublishing(false);
    setResMatch(""); setResA(""); setResB("");
    fetchMatches();
    setSavedMsg("Resultado publicado!");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  const closedMatches = matches.filter(m => m.status === "closed" || m.status === "open");

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 28, letterSpacing: 0.3, color: "var(--ink)", margin: 0 }}>CENTRAL ADM</h1>

      {savedMsg && (
        <div style={{ background: "var(--primary-soft)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, color: "var(--primary-strong)" }}>
          ✓ {savedMsg}
        </div>
      )}

      {/* tabs */}
      <div style={{ display: "flex", gap: 5, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 5, width: "fit-content" }}>
        {(["partidas", "resultados"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 13.5, background: tab === t ? "var(--ink)" : "transparent", color: tab === t ? "var(--surface)" : "var(--ink-2)", transition: "all .12s" }}>
            {t === "partidas" ? "Partidas" : "Resultados"}
          </button>
        ))}
      </div>

      {tab === "partidas" && (
        <>
          {/* form nova partida */}
          <form onSubmit={handleAddMatch} style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--line)", padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>Nova partida</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Fase">
                <select value={f.phase} onChange={e => setF(p => ({ ...p, phase: e.target.value }))} style={fieldStyle}>
                  {PHASES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </Field>
              <Field label="Status inicial">
                <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} style={fieldStyle}>
                  <option value="upcoming">Em breve</option>
                  <option value="open">Aberto</option>
                </select>
              </Field>
            </div>

            {f.phase === "groups" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Grupo">
                  <select value={f.group_name} onChange={e => setF(p => ({ ...p, group_name: e.target.value }))} style={fieldStyle}>
                    {GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Rodada">
                  <select value={f.round} onChange={e => setF(p => ({ ...p, round: e.target.value }))} style={fieldStyle}>
                    <option value="1">Rodada 1</option><option value="2">Rodada 2</option><option value="3">Rodada 3</option>
                  </select>
                </Field>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
              <Field label="Time A"><input value={f.team_a} onChange={e => setF(p => ({ ...p, team_a: e.target.value }))} placeholder="Brasil" style={fieldStyle} /></Field>
              <Field label="Código A"><input value={f.code_a} onChange={e => setF(p => ({ ...p, code_a: e.target.value }))} placeholder="BR" maxLength={3} style={fieldStyle} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
              <Field label="Time B"><input value={f.team_b} onChange={e => setF(p => ({ ...p, team_b: e.target.value }))} placeholder="Argentina" style={fieldStyle} /></Field>
              <Field label="Código B"><input value={f.code_b} onChange={e => setF(p => ({ ...p, code_b: e.target.value }))} placeholder="AR" maxLength={3} style={fieldStyle} /></Field>
            </div>
            <Field label="Data e hora">
              <input type="datetime-local" value={f.match_date} onChange={e => setF(p => ({ ...p, match_date: e.target.value }))} style={fieldStyle} />
            </Field>

            <button type="submit" disabled={saving} style={{ height: 48, borderRadius: 12, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 0 var(--primary-strong)", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Salvando..." : "Adicionar partida →"}
            </button>
          </form>

          {/* lista */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>Partidas cadastradas ({matches.length})</p>
            {loading && <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Carregando...</p>}
            {matches.map((m) => (
              <div key={m.id} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", margin: "0 0 2px" }}>{m.team_a} vs {m.team_b}</p>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
                    {PHASES.find(p => p.v === m.phase)?.l}{m.group_name ? ` · Grupo ${m.group_name}` : ""} · {new Date(m.match_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <select value={m.status} onChange={e => handleUpdateStatus(m.id, e.target.value)}
                  style={{ ...fieldStyle, width: "auto", height: 34, fontSize: 12, color: STATUS_COLOR[m.status], fontWeight: 700, padding: "0 8px" }}>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "resultados" && (
        <>
          <form onSubmit={handlePublishResult} style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--line)", padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>Publicar resultado</p>
            <Field label="Partida">
              <select value={resMatch} onChange={e => setResMatch(e.target.value)} style={fieldStyle}>
                <option value="">Selecione a partida...</option>
                {closedMatches.map(m => (
                  <option key={m.id} value={m.id}>{m.team_a} vs {m.team_b} ({STATUS_LABEL[m.status]})</option>
                ))}
              </select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label={`Gols ${closedMatches.find(m => m.id === resMatch)?.team_a ?? "Time A"}`}>
                <input type="number" min={0} max={20} value={resA} onChange={e => setResA(e.target.value)} placeholder="0" style={fieldStyle} />
              </Field>
              <Field label={`Gols ${closedMatches.find(m => m.id === resMatch)?.team_b ?? "Time B"}`}>
                <input type="number" min={0} max={20} value={resB} onChange={e => setResB(e.target.value)} placeholder="0" style={fieldStyle} />
              </Field>
            </div>
            <button type="submit" disabled={publishing || !resMatch || resA === "" || resB === ""} style={{ height: 48, borderRadius: 12, border: "none", background: "var(--live)", color: "#fff", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: (!resMatch || resA === "" || resB === "") ? 0.5 : 1 }}>
              {publishing ? "Publicando..." : "Publicar resultado →"}
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>Resultados publicados</p>
            {matches.filter(m => m.status === "finished").map(m => (
              <div key={m.id} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", margin: "0 0 2px" }}>{m.team_a} {m.result_a} × {m.result_b} {m.team_b}</p>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{new Date(m.match_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-2)", background: "var(--app-bg)", borderRadius: 8, padding: "3px 8px" }}>Finalizado</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
