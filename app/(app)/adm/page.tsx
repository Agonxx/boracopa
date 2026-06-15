"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import UserPredictionsModal from "@/components/ui/UserPredictionsModal";

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
const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
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

  const [mainTab, setMainTab] = useState<"jogos" | "usuarios">("jogos");
  const [jogosTab, setJogosTab] = useState<"partidas" | "resultados" | "importar">("partidas");
  const [usuariosTab, setUsuariosTab] = useState<"usuarios" | "boloes">("usuarios");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // form — nova partida
  const [f, setF] = useState({ phase: "groups", group_name: "A", round: "1", team_a: "", team_b: "", code_a: "", code_b: "", match_date: "", status: "upcoming" });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // palpite manual
  const [manualPred, setManualPred] = useState({ userId: "", matchId: "", scoreA: "", scoreB: "" });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualMsg, setManualMsg] = useState("");
  const [admUsers, setAdmUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [admUsersLoaded, setAdmUsersLoaded] = useState(false);

  async function loadAdmUsers() {
    if (admUsersLoaded) return;
    const { data } = await supabase.rpc("get_all_users_for_admin");
    setAdmUsers((data as any[]) ?? []);
    setAdmUsersLoaded(true);
  }

  async function handleManualPred(e: React.FormEvent) {
    e.preventDefault();
    if (!manualPred.userId || !manualPred.matchId || manualPred.scoreA === "" || manualPred.scoreB === "") return;
    setManualSaving(true);
    const { error } = await supabase.rpc("admin_upsert_prediction", {
      p_user_id: manualPred.userId,
      p_match_id: manualPred.matchId,
      p_score_a: parseInt(manualPred.scoreA),
      p_score_b: parseInt(manualPred.scoreB),
    });
    if (!error) {
      const match = matches.find(m => m.id === manualPred.matchId);
      if (match?.status === "finished") {
        await supabase.rpc("recalculate_all_points");
        setManualMsg("Palpite cadastrado e pontos recalculados!");
      } else {
        setManualMsg("Palpite cadastrado com sucesso!");
      }
      setManualPred({ userId: "", matchId: "", scoreA: "", scoreB: "" });
    } else {
      setManualMsg(`Erro: ${error.message}`);
    }
    setManualSaving(false);
    setTimeout(() => setManualMsg(""), 5000);
  }

  // usuarios
  interface UserRow { id: string; email: string; name: string | null; created_at: string; }
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // boloes (adm)
  interface BolaoAdmRow { id: string; name: string; invite_code: string; entry_fee: number; memberCount: number; }
  interface BolaoMemberRow { user_id: string; pts: number; cravadas: number; paid: boolean; profiles: { name: string } | null; }
  const [boloesAdm, setBoloesAdm] = useState<BolaoAdmRow[]>([]);
  const [boloesAdmLoading, setBoloesAdmLoading] = useState(false);
  const [selectedBolao, setSelectedBolao] = useState<BolaoAdmRow | null>(null);
  const [bolaoMembers, setBolaoMembers] = useState<BolaoMemberRow[]>([]);
  const [bolaoMembersLoading, setBolaoMembersLoading] = useState(false);
  const [predUser, setPredUser] = useState<{ id: string; name: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function handleRemoveMember(userId: string) {
    if (!selectedBolao) return;
    await supabase.from("bolao_members").delete().eq("bolao_id", selectedBolao.id).eq("user_id", userId);
    setBolaoMembers(prev => prev.filter(m => m.user_id !== userId));
    setBoloesAdm(prev => prev.map(b => b.id === selectedBolao.id ? { ...b, memberCount: b.memberCount - 1 } : b));
    setSelectedBolao(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : null);
    setConfirmRemove(null);
  }

  async function fetchBoloesAdm() {
    setBoloesAdmLoading(true);
    const { data } = await supabase.from("boloes").select("id, name, invite_code, entry_fee, bolao_members(count)").order("name");
    setBoloesAdm((data ?? []).map((b: any) => ({
      id: b.id, name: b.name, invite_code: b.invite_code, entry_fee: b.entry_fee,
      memberCount: b.bolao_members?.[0]?.count ?? 0,
    })));
    setBoloesAdmLoading(false);
  }

  async function openBolaoModal(b: BolaoAdmRow) {
    setSelectedBolao(b);
    setBolaoMembers([]);
    setBolaoMembersLoading(true);
    const { data } = await supabase
      .from("bolao_members")
      .select("user_id, pts, cravadas, paid, profiles!bolao_members_user_id_fkey(name)")
      .eq("bolao_id", b.id)
      .order("pts", { ascending: false });
    setBolaoMembers((data ?? []) as unknown as BolaoMemberRow[]);
    setBolaoMembersLoading(false);
  }
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState("");
  const [userSort, setUserSort] = useState<"name" | "recent">("recent");

  async function fetchUsers() {
    setUsersLoading(true);
    const { data } = await supabase.rpc("get_all_users_for_admin");
    setUsers((data as UserRow[]) ?? []);
    setUsersLoading(false);
  }

  async function handleResetPassword(email: string, userId: string) {
    const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    setResetMsg(prev => ({ ...prev, [userId]: error ? "Erro ao enviar." : "Email enviado!" }));
    setTimeout(() => setResetMsg(prev => { const n = { ...prev }; delete n[userId]; return n; }), 4000);
  }

  // importar
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "preview" | "importing" | "done" | "error">("idle");
  const [importData, setImportData] = useState<{ count: number; matches: any[] } | null>(null);
  const [importMsg, setImportMsg] = useState("");

  async function handleFetchMatches() {
    setImportStatus("loading");
    setImportMsg("");
    try {
      const res = await fetch("/api/import-matches");
      const json = await res.json();
      if (!res.ok) { setImportMsg(json.error ?? "Erro ao buscar"); setImportStatus("error"); return; }
      setImportData(json);
      setImportStatus("preview");
    } catch {
      setImportMsg("Erro de rede."); setImportStatus("error");
    }
  }

  async function handleImport() {
    if (!importData) return;
    setImportStatus("importing");
    const { error } = await supabase.from("matches").insert(importData.matches);
    if (error) { setImportMsg(`Erro: ${error.message}`); setImportStatus("error"); return; }
    setImportMsg(`✓ ${importData.count} partidas importadas com sucesso!`);
    setImportData(null);
    setImportStatus("done");
    fetchMatches();
  }

  // resultados
  const [recalculating, setRecalculating] = useState(false);

  async function handleRecalculate() {
    if (!window.confirm("Zerar todos os pontos e recalcular a partir dos resultados publicados?")) return;
    setRecalculating(true);
    const { error } = await supabase.rpc("recalculate_all_points");
    setRecalculating(false);
    setSavedMsg(error ? `Erro: ${error.message}` : "Pontos recalculados com sucesso!");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  const [resMatch, setResMatch] = useState<string>("");
  const [resA, setResA] = useState("");
  const [resB, setResB] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editA, setEditA] = useState("");
  const [editB, setEditB] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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
      match_date: new Date(f.match_date).toISOString(),
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
    const resultA = parseInt(resA);
    const resultB = parseInt(resB);

    const { error: matchErr } = await supabase.from("matches").update({
      result_a: resultA, result_b: resultB, status: "finished",
    }).eq("id", resMatch);

    if (matchErr) {
      setPublishing(false);
      setSavedMsg("Erro ao salvar resultado.");
      setTimeout(() => setSavedMsg(""), 4000);
      return;
    }

    await supabase.rpc("apply_match_result", {
      p_match_id: resMatch,
      p_result_a: resultA,
      p_result_b: resultB,
    });

    setPublishing(false);
    setResMatch(""); setResA(""); setResB("");
    fetchMatches();
    setSavedMsg("Resultado publicado! Pontos distribuídos.");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  async function handleEditResult() {
    if (!editingId || editA === "" || editB === "") return;
    setEditSaving(true);
    await supabase.from("matches").update({
      result_a: parseInt(editA),
      result_b: parseInt(editB),
    }).eq("id", editingId);
    await supabase.rpc("recalculate_all_points");
    setEditSaving(false);
    setEditingId(null);
    fetchMatches();
    setSavedMsg("Resultado corrigido! Pontos recalculados.");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  const closedMatches = matches.filter(m => m.status === "closed" || m.status === "open");

  const teamOptions = (() => {
    const seen = new Set<string>();
    const result: { name: string; code: string }[] = [];
    for (const m of matches) {
      if (!seen.has(m.team_a)) { seen.add(m.team_a); result.push({ name: m.team_a, code: m.code_a }); }
      if (!seen.has(m.team_b)) { seen.add(m.team_b); result.push({ name: m.team_b, code: m.code_b }); }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  })();

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 28, letterSpacing: 0.3, color: "var(--ink)", margin: 0 }}>CENTRAL ADM</h1>

      {savedMsg && (
        <div style={{ background: "var(--primary-soft)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, color: "var(--primary-strong)" }}>
          ✓ {savedMsg}
        </div>
      )}

      {/* main tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 4 }}>
        {(["jogos", "usuarios"] as const).map(t => (
          <button key={t} onClick={() => { setMainTab(t); if (t === "usuarios") { fetchUsers(); fetchBoloesAdm(); } }} style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 14, background: mainTab === t ? "var(--ink)" : "transparent", color: mainTab === t ? "var(--surface)" : "var(--ink-2)", transition: "all .12s" }}>
            {t === "jogos" ? "Jogos" : "Usuários"}
          </button>
        ))}
      </div>

      {/* sub tabs — jogos */}
      {mainTab === "jogos" && (
        <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: 4 }}>
          {(["partidas", "resultados", "importar"] as const).map(t => (
            <button key={t} onClick={() => setJogosTab(t)} style={{ flex: 1, minWidth: "fit-content", padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, background: jogosTab === t ? "var(--primary)" : "transparent", color: jogosTab === t ? "var(--on-primary)" : "var(--ink-2)", transition: "all .12s", whiteSpace: "nowrap" }}>
              {t === "partidas" ? "Partidas" : t === "resultados" ? "Resultados" : "Importar"}
            </button>
          ))}
        </div>
      )}

      {/* sub tabs — usuarios */}
      {mainTab === "usuarios" && (
        <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: 4 }}>
          {(["usuarios", "boloes"] as const).map(t => (
            <button key={t} onClick={() => { setUsuariosTab(t); if (t === "usuarios") fetchUsers(); if (t === "boloes") fetchBoloesAdm(); }} style={{ flex: 1, padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, background: usuariosTab === t ? "var(--primary)" : "transparent", color: usuariosTab === t ? "var(--on-primary)" : "var(--ink-2)", transition: "all .12s" }}>
              {t === "usuarios" ? "Usuários" : "Bolões"}
            </button>
          ))}
        </div>
      )}

      {mainTab === "jogos" && jogosTab === "partidas" && (
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

            <Field label="Time A">
              <select value={f.team_a} onChange={e => {
                const t = teamOptions.find(t => t.name === e.target.value);
                setF(p => ({ ...p, team_a: e.target.value, code_a: t?.code ?? "" }));
              }} style={fieldStyle}>
                <option value="">Selecione o time A...</option>
                {teamOptions.map(t => (
                  <option key={t.name} value={t.name}>{t.name} ({t.code})</option>
                ))}
              </select>
            </Field>
            <Field label="Time B">
              <select value={f.team_b} onChange={e => {
                const t = teamOptions.find(t => t.name === e.target.value);
                setF(p => ({ ...p, team_b: e.target.value, code_b: t?.code ?? "" }));
              }} style={fieldStyle}>
                <option value="">Selecione o time B...</option>
                {teamOptions.filter(t => t.name !== f.team_a).map(t => (
                  <option key={t.name} value={t.name}>{t.name} ({t.code})</option>
                ))}
              </select>
            </Field>
            <Field label="Data e hora">
              <input type="datetime-local" value={f.match_date} onChange={e => setF(p => ({ ...p, match_date: e.target.value }))} style={fieldStyle} />
            </Field>

            <button type="submit" disabled={saving} style={{ height: 48, borderRadius: 12, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 0 var(--primary-strong)", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Salvando..." : "Adicionar partida →"}
            </button>
          </form>

          {/* palpite manual */}
          <form onSubmit={handleManualPred} style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--line)", padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>Cadastrar palpite manual</p>
            {manualMsg && (
              <div style={{ background: manualMsg.startsWith("Erro") ? "#fff0f0" : "var(--primary-soft)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, color: manualMsg.startsWith("Erro") ? "#c0392b" : "var(--primary-strong)" }}>
                {manualMsg.startsWith("Erro") ? manualMsg : `✓ ${manualMsg}`}
              </div>
            )}
            <Field label="Usuário">
              <select
                value={manualPred.userId}
                onFocus={loadAdmUsers}
                onChange={e => setManualPred(p => ({ ...p, userId: e.target.value }))}
                style={fieldStyle}
              >
                <option value="">Selecione o usuário...</option>
                {[...admUsers]
                  .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, "pt-BR"))
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name ?? "(sem nome)"} — {u.email}</option>
                  ))}
              </select>
            </Field>
            <Field label="Partida">
              <select
                value={manualPred.matchId}
                onChange={e => setManualPred(p => ({ ...p, matchId: e.target.value }))}
                style={fieldStyle}
              >
                <option value="">Selecione a partida...</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.team_a} vs {m.team_b} · {new Date(m.match_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} [{STATUS_LABEL[m.status]}]
                  </option>
                ))}
              </select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label={matches.find(m => m.id === manualPred.matchId)?.team_a ?? "Gols Time A"}>
                <input type="number" min={0} max={20} value={manualPred.scoreA} onChange={e => setManualPred(p => ({ ...p, scoreA: e.target.value }))} placeholder="0" style={fieldStyle} />
              </Field>
              <Field label={matches.find(m => m.id === manualPred.matchId)?.team_b ?? "Gols Time B"}>
                <input type="number" min={0} max={20} value={manualPred.scoreB} onChange={e => setManualPred(p => ({ ...p, scoreB: e.target.value }))} placeholder="0" style={fieldStyle} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={manualSaving || !manualPred.userId || !manualPred.matchId || manualPred.scoreA === "" || manualPred.scoreB === ""}
              style={{ height: 48, borderRadius: 12, border: "none", background: "var(--ink)", color: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: (!manualPred.userId || !manualPred.matchId || manualPred.scoreA === "" || manualPred.scoreB === "") ? 0.5 : 1 }}
            >
              {manualSaving ? "Salvando..." : "Cadastrar palpite →"}
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

      {mainTab === "jogos" && jogosTab === "resultados" && (
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>
                Resultados publicados ({matches.filter(m => m.status === "finished").length})
              </p>
              <button onClick={handleRecalculate} disabled={recalculating} style={{ marginLeft: "auto", height: 34, padding: "0 14px", borderRadius: 9, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, color: "var(--ink-2)", cursor: recalculating ? "default" : "pointer", whiteSpace: "nowrap", opacity: recalculating ? 0.6 : 1 }}>
                {recalculating ? "Recalculando..." : "↺ Recalcular pontos"}
              </button>
            </div>
            {matches.filter(m => m.status === "finished").map(m => (
              <div key={m.id} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                {editingId === m.id ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", margin: "0 0 8px" }}>{m.team_a} × {m.team_b}</p>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="number" min={0} max={20} value={editA} onChange={e => setEditA(e.target.value)}
                          style={{ ...fieldStyle, width: 56, height: 36, textAlign: "center", padding: "0 6px" }} />
                        <span style={{ fontWeight: 800, color: "var(--ink-3)" }}>×</span>
                        <input type="number" min={0} max={20} value={editB} onChange={e => setEditB(e.target.value)}
                          style={{ ...fieldStyle, width: 56, height: 36, textAlign: "center", padding: "0 6px" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setEditingId(null)} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
                        Cancelar
                      </button>
                      <button onClick={handleEditResult} disabled={editSaving || editA === "" || editB === ""}
                        style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, cursor: "pointer", opacity: (editSaving || editA === "" || editB === "") ? 0.6 : 1 }}>
                        {editSaving ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", margin: "0 0 2px" }}>{m.team_a} {m.result_a} × {m.result_b} {m.team_b}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{new Date(m.match_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                    </div>
                    <button onClick={() => { setEditingId(m.id); setEditA(String(m.result_a ?? "")); setEditB(String(m.result_b ?? "")); }}
                      style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12, color: "var(--ink-2)", cursor: "pointer", flexShrink: 0 }}>
                      Editar
                    </button>
                  </>
                )}
              </div>
            ))}
            {matches.filter(m => m.status === "finished").length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum resultado publicado ainda.</p>
            )}
          </div>
        </>
      )}

      {mainTab === "usuarios" && usuariosTab === "usuarios" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>
              Usuários ({users.length})
            </p>
            <button onClick={fetchUsers} style={{ marginLeft: "auto", height: 32, padding: "0 14px", borderRadius: 8, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
              Atualizar
            </button>
          </div>

          {/* Search + sort */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              style={{ ...fieldStyle, flex: 1, height: 38, fontSize: 13 }}
            />
            {(["recent", "name"] as const).map(s => (
              <button key={s} onClick={() => setUserSort(s)} style={{ height: 38, padding: "0 12px", borderRadius: 9, border: "1.5px solid var(--line-strong)", background: userSort === s ? "var(--ink)" : "transparent", color: userSort === s ? "var(--surface)" : "var(--ink-2)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                {s === "recent" ? "Recentes" : "Nome A-Z"}
              </button>
            ))}
          </div>

          {usersLoading && <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Carregando...</p>}

          {(() => {
            const q = userSearch.toLowerCase();
            const displayed = users
              .filter(u => !q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
              .sort((a, b) => userSort === "name"
                ? (a.name ?? a.email).localeCompare(b.name ?? b.email)
                : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            if (!usersLoading && displayed.length === 0)
              return <p style={{ fontSize: 13, color: "var(--ink-3)" }}>{userSearch ? "Nenhum resultado." : "Nenhum usuário encontrado."}</p>;
            return displayed.map((u) => (
            <div key={u.id} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              {/* avatar */}
              <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: "var(--app-bg)", border: "1.5px solid var(--line-strong)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: 15, color: "var(--ink-2)", letterSpacing: 0.3 }}>
                {(u.name ?? u.email).slice(0, 2).toUpperCase()}
              </div>

              {/* info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.name ?? <span style={{ color: "var(--ink-3)", fontStyle: "italic" }}>sem nome</span>}
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-3)" }}>
                  desde {new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* reset */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                {resetMsg[u.id] ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: resetMsg[u.id] === "Email enviado!" ? "var(--primary-strong)" : "#c0392b" }}>
                    {resetMsg[u.id]}
                  </span>
                ) : (
                  <button onClick={() => handleResetPassword(u.email, u.id)} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer", whiteSpace: "nowrap" }}>
                    Resetar senha
                  </button>
                )}
              </div>
            </div>
          ));
          })()}
        </div>
      )}

      {mainTab === "jogos" && jogosTab === "importar" && (
        <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--line)", padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: "0 0 6px" }}>Importar Copa 2026</p>
            <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>
              Busca as partidas da Copa do Mundo 2026 via <b>football-data.org</b> e importa para o banco.
              Horários são convertidos automaticamente para <b>Brasília (UTC-3)</b>.
            </p>
          </div>

          {importMsg && (
            <div style={{ background: importStatus === "error" ? "#fff0f0" : "var(--primary-soft)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, color: importStatus === "error" ? "#c0392b" : "var(--primary-strong)" }}>
              {importMsg}
            </div>
          )}

          {importStatus === "preview" && importData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                {importData.count} partidas encontradas
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                {importData.matches.slice(0, 10).map((m: any, i: number) => (
                  <div key={i} style={{ fontSize: 12.5, color: "var(--ink-2)", padding: "6px 10px", background: "var(--app-bg)", borderRadius: 8 }}>
                    <b style={{ color: "var(--ink)" }}>{m.team_a} vs {m.team_b}</b>
                    {" · "}{m.phase === "groups" ? `Grupo ${m.group_name} Rod.${m.round}` : m.phase}
                    {" · "}{new Date(m.match_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                ))}
                {importData.count > 10 && (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>
                    + {importData.count - 10} partidas
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => { setImportData(null); setImportStatus("idle"); setImportMsg(""); }}
                  style={{ flex: 1, height: 44, borderRadius: 11, border: "1.5px solid var(--line-strong)", background: "transparent", color: "var(--ink)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={handleImport}
                  style={{ flex: 2, height: 44, borderRadius: 11, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 0 var(--primary-strong)" }}>
                  Importar {importData.count} partidas →
                </button>
              </div>
            </div>
          )}

          {(importStatus === "idle" || importStatus === "error") && (
            <button onClick={handleFetchMatches}
              style={{ height: 48, borderRadius: 12, border: "none", background: "var(--ink)", color: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              Buscar partidas →
            </button>
          )}

          {importStatus === "loading" && (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>Buscando partidas...</p>
          )}

          {importStatus === "importing" && (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>Importando...</p>
          )}

          {importStatus === "done" && (
            <button onClick={() => { setImportStatus("idle"); setImportMsg(""); }}
              style={{ height: 44, borderRadius: 11, border: "1.5px solid var(--line-strong)", background: "transparent", color: "var(--ink)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Importar novamente
            </button>
          )}

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 4 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: "0 0 10px" }}>Zona de perigo</p>
            <button
              onClick={async () => {
                if (!window.confirm("Apagar TODAS as partidas, palpites e zerar pontos? Esta ação não pode ser desfeita.")) return;
                // 1. Zera pts e cravadas de todos os membros
                await supabase.from("bolao_members").update({ pts: 0, cravadas: 0 }).gt("pts", -1);
                // 2. Apaga partidas (palpites em cascata via FK)
                const { error } = await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                if (error) setImportMsg(`Erro: ${error.message}`);
                else { setImportMsg("✓ Partidas apagadas e pontos zerados."); fetchMatches(); }
              }}
              style={{ height: 42, padding: "0 20px", borderRadius: 11, border: "1.5px solid #e74c3c", background: "transparent", color: "#e74c3c", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>
              Apagar todas as partidas
            </button>
          </div>
        </div>
      )}

      {mainTab === "usuarios" && usuariosTab === "boloes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 14, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", margin: 0 }}>
              Bolões ({boloesAdm.length})
            </p>
            <button onClick={fetchBoloesAdm} style={{ marginLeft: "auto", height: 32, padding: "0 14px", borderRadius: 8, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
              Atualizar
            </button>
          </div>

          {boloesAdmLoading && <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Carregando...</p>}

          {!boloesAdmLoading && boloesAdm.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum bolão encontrado.</p>
          )}

          {boloesAdm.map(b => (
            <div key={b.id} onClick={() => openBolaoModal(b)} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 14.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {b.name}
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>
                    {b.memberCount} participante{b.memberCount !== 1 ? "s" : ""}
                  </span>
                  {b.entry_fee > 0 && (
                    <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>
                      · R$ {b.entry_fee.toFixed(2)}
                    </span>
                  )}
                  <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--ink-3)", background: "var(--app-bg)", borderRadius: 6, padding: "2px 7px", border: "1px solid var(--line)" }}>
                    {b.invite_code}
                  </span>
                </div>
              </div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}

          {/* modal palpites de membro */}
          {predUser && (
            <UserPredictionsModal userId={predUser.id} userName={predUser.name} onClose={() => setPredUser(null)} />
          )}

          {/* modal membros do bolão */}
          {selectedBolao && (
            <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 16 }}>
              <div onClick={() => { setSelectedBolao(null); setConfirmRemove(null); }} style={{ position: "absolute", inset: 0, background: "rgba(20,18,14,.55)" }} />
              <div style={{ position: "relative", width: "100%", maxWidth: 460, background: "var(--app-bg)", borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
                {/* header */}
                <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 16, letterSpacing: 0.3, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedBolao.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
                      {selectedBolao.memberCount} participante{selectedBolao.memberCount !== 1 ? "s" : ""} · código <span style={{ fontFamily: "monospace" }}>{selectedBolao.invite_code}</span>
                    </p>
                  </div>
                  <button onClick={() => { setSelectedBolao(null); setConfirmRemove(null); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {/* lista */}
                <div style={{ overflowY: "auto", padding: "12px 14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {bolaoMembersLoading ? (
                    <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>Carregando...</p>
                  ) : bolaoMembers.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>Sem membros.</p>
                  ) : bolaoMembers.map((m, i) => {
                    const name = m.profiles?.name ?? "Usuário";
                    return (
                      <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)" }}>
                        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 13, color: "var(--ink-3)", width: 20, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                        <div
                          onClick={() => setPredUser({ id: m.user_id, name })}
                          title="Ver palpites"
                          style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "var(--primary-soft)", display: "grid", placeItems: "center", fontFamily: "Anton, sans-serif", fontSize: 12, color: "var(--primary-strong)", cursor: "pointer" }}
                        >
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{m.cravadas} crav.</span>
                          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 15, color: "var(--primary-strong)" }}>{m.pts}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--primary-strong)", textTransform: "uppercase" }}>pts</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: m.paid ? "var(--primary-soft)" : "var(--app-bg)", color: m.paid ? "var(--primary-strong)" : "var(--ink-3)", border: `1px solid ${m.paid ? "var(--primary-strong)" : "var(--line-strong)"}` }}>
                            {m.paid ? "pago" : "pendente"}
                          </span>
                          {confirmRemove === m.user_id ? (
                            <>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>Remover?</span>
                              <button onClick={() => handleRemoveMember(m.user_id)} style={{ height: 24, padding: "0 8px", borderRadius: 8, border: "none", background: "#e74c3c", color: "#fff", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>Sim</button>
                              <button onClick={() => setConfirmRemove(null)} style={{ height: 24, padding: "0 8px", borderRadius: 8, border: "1.5px solid var(--line-strong)", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 11, color: "var(--ink-2)", cursor: "pointer" }}>Não</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmRemove(m.user_id)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid var(--line-strong)", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--ink-3)", flexShrink: 0 }} title="Remover do bolão">
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
