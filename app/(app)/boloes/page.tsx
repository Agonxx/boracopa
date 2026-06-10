"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Hash, Users, ChevronRight, Trophy, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { useBolaoStore } from "@/store/bolao";

interface Bolao {
  id: string;
  name: string;
  invite_code: string;
  entry_fee: number;
  owner_id: string;
  _member_count?: number;
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-3)", padding: 4, display: "grid", placeItems: "center" }}>
      {copied ? <Check size={15} strokeWidth={2.4} style={{ color: "var(--primary)" }} /> : <Copy size={15} strokeWidth={1.9} />}
    </button>
  );
}

export default function BoloesPag() {
  const { user } = useAuthStore();
  const { activeBolaoId, setUserBoloes, clearActiveBolao } = useBolaoStore();
  const router = useRouter();
  const supabase = createClient();

  const [boloes, setBoloes] = useState<Bolao[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "criar" | "entrar">("list");

  // criar form
  const [criarNome, setCriarNome] = useState("");
  const [criarTaxa, setCriarTaxa] = useState("");
  const [criarPix, setCriarPix] = useState("");
  const [criarPixNome, setCriarPixNome] = useState("");
  const [criarPremio, setCriarPremio] = useState("");
  const [criarLoading, setCriarLoading] = useState(false);
  const [criarError, setCriarError] = useState("");

  // entrar form
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const fetchBoloes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("bolao_members")
      .select("boloes(id, name, invite_code, entry_fee, owner_id)")
      .eq("user_id", user.id);

    const list: Bolao[] = (data ?? [])
      .map((d: any) => d.boloes)
      .filter(Boolean);

    // busca contagem de membros
    const withCount = await Promise.all(list.map(async (b) => {
      const { count } = await supabase
        .from("bolao_members")
        .select("id", { count: "exact", head: true })
        .eq("bolao_id", b.id);
      return { ...b, _member_count: count ?? 0 };
    }));

    setBoloes(withCount);
    setUserBoloes(withCount.map(b => ({ id: b.id, name: b.name })));
    if (activeBolaoId && !withCount.find(b => b.id === activeBolaoId)) {
      clearActiveBolao();
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBoloes(); }, [fetchBoloes]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!criarNome.trim() || !user) return;
    setCriarLoading(true);
    setCriarError("");

    let code = generateCode();
    const { data: bolao, error } = await supabase
      .from("boloes")
      .insert({
        name: criarNome.trim(),
        owner_id: user.id,
        invite_code: code,
        entry_fee: criarTaxa ? parseFloat(criarTaxa) : 0,
        pix_key: criarPix || null,
        pix_name: criarPixNome || null,
        prize_description: criarPremio || null,
      })
      .select("id")
      .single();

    if (error) {
      // tenta novo código se conflito de unique
      if (error.code === "23505") {
        code = generateCode();
        const { data: bolao2, error: e2 } = await supabase
          .from("boloes")
          .insert({ name: criarNome.trim(), owner_id: user.id, invite_code: code, entry_fee: criarTaxa ? parseFloat(criarTaxa) : 0 })
          .select("id").single();
        if (e2 || !bolao2) { setCriarError("Erro ao criar bolão."); setCriarLoading(false); return; }
        await supabase.from("bolao_members").insert({ bolao_id: bolao2.id, user_id: user.id, paid: true });
        router.push(`/boloes/${bolao2.id}`);
        return;
      }
      setCriarError("Erro ao criar bolão.");
      setCriarLoading(false);
      return;
    }

    await supabase.from("bolao_members").insert({ bolao_id: bolao!.id, user_id: user.id, paid: true });
    router.push(`/boloes/${bolao!.id}`);
  }

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;
    setJoinLoading(true);
    setJoinError("");

    const { data: bolao } = await supabase
      .from("boloes")
      .select("id, name")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .single();

    if (!bolao) { setJoinError("Código inválido. Verifique e tente de novo."); setJoinLoading(false); return; }

    const { error } = await supabase
      .from("bolao_members")
      .insert({ bolao_id: bolao.id, user_id: user.id });

    if (error?.code === "23505") { setJoinError("Você já está neste bolão."); setJoinLoading(false); return; }
    if (error) { setJoinError("Erro ao entrar no bolão."); setJoinLoading(false); return; }

    router.push(`/boloes/${bolao.id}`);
  }

  const sectionTitle: React.CSSProperties = { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 21, letterSpacing: 0.4, color: "var(--ink)" };

  if (view === "criar") return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto">
      <button onClick={() => setView("list")} style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>← Voltar</button>
      <h2 style={{ ...sectionTitle, fontSize: 26, marginBottom: 4 }}>Criar bolão</h2>
      <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 24 }}>O código de convite é gerado automaticamente.</p>
      <form onSubmit={handleCriar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { label: "Nome do bolão *", value: criarNome, onChange: setCriarNome, placeholder: "Ex: Bolão do Trampo 2026" },
          { label: "Valor da entrada (R$)", value: criarTaxa, onChange: setCriarTaxa, placeholder: "0 = grátis", type: "number" },
          { label: "Chave PIX", value: criarPix, onChange: setCriarPix, placeholder: "CPF, e-mail ou telefone" },
          { label: "Nome do titular PIX", value: criarPixNome, onChange: setCriarPixNome, placeholder: "Nome na conta" },
          { label: "Descrição do prêmio", value: criarPremio, onChange: setCriarPremio, placeholder: "Ex: Top 3 dividem o prêmio" },
        ].map(({ label, value, onChange, placeholder, type }) => (
          <label key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-2)" }}>{label}</span>
            <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
              style={{ height: 48, padding: "0 14px", borderRadius: 12, border: "1.6px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontSize: 15, color: "var(--ink)", outline: "none" }} />
          </label>
        ))}
        {criarError && <p style={{ fontSize: 12.5, color: "var(--live)", fontWeight: 600 }}>{criarError}</p>}
        <button type="submit" disabled={criarLoading || !criarNome.trim()} style={{ height: 52, borderRadius: 13, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15.5, cursor: criarLoading ? "not-allowed" : "pointer", boxShadow: "0 5px 0 var(--primary-strong)", opacity: criarLoading ? 0.7 : 1, marginTop: 4 }}>
          {criarLoading ? "Criando..." : "Criar bolão →"}
        </button>
      </form>
    </div>
  );

  if (view === "entrar") return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto">
      <button onClick={() => setView("list")} style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>← Voltar</button>
      <h2 style={{ ...sectionTitle, fontSize: 26, marginBottom: 4 }}>Entrar com código</h2>
      <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 24 }}>Peça o código de 6 letras para quem criou o bolão.</p>
      <form onSubmit={handleEntrar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6} placeholder="XXXXXX"
          style={{ height: 64, padding: "0 20px", borderRadius: 14, border: "1.6px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Anton, sans-serif", fontSize: 32, letterSpacing: 8, color: "var(--ink)", outline: "none", textAlign: "center", textTransform: "uppercase" }}
        />
        {joinError && <p style={{ fontSize: 12.5, color: "var(--live)", fontWeight: 600, textAlign: "center" }}>{joinError}</p>}
        <button type="submit" disabled={joinLoading || joinCode.length < 6} style={{ height: 52, borderRadius: 13, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15.5, cursor: "pointer", boxShadow: "0 5px 0 var(--primary-strong)", opacity: joinCode.length < 6 ? 0.5 : 1 }}>
          {joinLoading ? "Entrando..." : "Entrar no bolão →"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={sectionTitle}>Meus bolões</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setView("entrar")} style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 11, border: "1.5px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
            <Hash size={15} strokeWidth={2} /> Código
          </button>
          <button onClick={() => setView("criar")} style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 11, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 0 var(--primary-strong)" }}>
            <Plus size={15} strokeWidth={2.4} /> Criar
          </button>
        </div>
      </div>

      {/* lista */}
      {loading ? (
        <p style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>Carregando...</p>
      ) : boloes.length === 0 ? (
        <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px dashed var(--line-strong)", padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Trophy size={36} style={{ color: "var(--ink-3)" }} strokeWidth={1.5} />
          <p style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: "var(--ink)" }}>Você ainda não está em nenhum bolão</p>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Crie um novo ou entre com o código de um amigo.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setView("entrar")} style={{ height: 42, padding: "0 16px", borderRadius: 11, border: "1.5px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13.5, color: "var(--ink-2)", cursor: "pointer" }}>
              Entrar com código
            </button>
            <button onClick={() => setView("criar")} style={{ height: 42, padding: "0 16px", borderRadius: 11, border: "none", background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 4px 0 var(--primary-strong)" }}>
              Criar bolão
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {boloes.map((b) => (
            <div key={b.id} onClick={() => router.push(`/boloes/${b.id}`)}
              style={{ background: "var(--surface)", borderRadius: 18, padding: "14px 16px", border: "1px solid var(--line)", boxShadow: "0 1px 2px rgba(26,24,20,.04), 0 8px 24px -16px rgba(26,24,20,.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Trophy size={20} style={{ color: "var(--primary-strong)" }} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)", marginBottom: 2 }}>{b.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={12} strokeWidth={2} /> {b._member_count} participante{b._member_count !== 1 ? "s" : ""}
                  </span>
                  {b.entry_fee > 0 && (
                    <span style={{ fontSize: 12, color: "var(--primary-strong)", fontWeight: 700 }}>
                      R$ {b.entry_fee.toFixed(2)}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", fontFamily: "Anton, sans-serif", letterSpacing: 1, marginLeft: "auto" }}>
                    {b.invite_code}
                    <CopyButton text={`${typeof window !== "undefined" ? window.location.origin : ""}/convite/${b.invite_code}`} />
                  </span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "var(--ink-3)", flexShrink: 0 }} strokeWidth={1.9} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
