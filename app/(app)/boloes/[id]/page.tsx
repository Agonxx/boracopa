"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, Users, Crown, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";

interface Bolao {
  id: string; name: string; owner_id: string; invite_code: string;
  entry_fee: number; pix_key: string | null; pix_name: string | null;
  prize_description: string | null;
}
interface Member {
  id: string; user_id: string; paid: boolean; paid_at: string | null;
  profiles: { name: string };
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 10, border: "1.5px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
      {copied ? <><Check size={14} style={{ color: "var(--primary)" }} /> Copiado!</> : <><Copy size={14} /> {label ?? "Copiar"}</>}
    </button>
  );
}

export default function BolaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = bolao?.owner_id === user?.id;
  const paidCount = members.filter(m => m.paid).length;

  const fetch = useCallback(async () => {
    const [{ data: b }, { data: m }] = await Promise.all([
      supabase.from("boloes").select("*").eq("id", id).single(),
      supabase.from("bolao_members").select("id, user_id, paid, paid_at, profiles(name)").eq("bolao_id", id),
    ]);
    setBolao(b);
    setMembers((m as any) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  async function togglePaid(memberId: string, currentPaid: boolean) {
    await supabase.from("bolao_members").update({
      paid: !currentPaid,
      paid_at: !currentPaid ? new Date().toISOString() : null,
      paid_confirmed_by: !currentPaid ? user?.id : null,
    }).eq("id", memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, paid: !currentPaid } : m));
  }

  async function handleSair() {
    if (!user) return;
    if (!confirm("Tem certeza que quer sair deste bolão?")) return;
    await supabase.from("bolao_members").delete().eq("bolao_id", id).eq("user_id", user.id);
    router.replace("/boloes");
  }

  if (loading) return <div className="p-4 lg:p-8" style={{ color: "var(--ink-3)", fontSize: 14, fontWeight: 600 }}>Carregando...</div>;
  if (!bolao) return <div className="p-4 lg:p-8" style={{ color: "var(--live)", fontSize: 14, fontWeight: 600 }}>Bolão não encontrado.</div>;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* voltar */}
      <button onClick={() => router.push("/boloes")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", padding: 0, width: "fit-content" }}>
        <ChevronLeft size={16} strokeWidth={2} /> Meus bolões
      </button>

      {/* cabeçalho */}
      <div>
        <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 28, letterSpacing: 0.3, color: "var(--ink)", margin: "0 0 8px" }}>{bolao.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Anton, sans-serif", fontSize: 18, letterSpacing: 2, color: "var(--ink-2)", background: "var(--app-bg)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "4px 12px" }}>
            {bolao.invite_code}
          </span>
          <CopyButton text={bolao.invite_code} label="Copiar código" />
          <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={13} strokeWidth={2} /> {members.length} participante{members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* pagamento */}
      {bolao.entry_fee > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--line)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 13, letterSpacing: 1, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 2 }}>Entrada</p>
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 28, color: "var(--primary-strong)", lineHeight: 1 }}>R$ {bolao.entry_fee.toFixed(2)}</p>
            </div>
            {isOwner && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Pagamentos</p>
                <p style={{ fontFamily: "Anton, sans-serif", fontSize: 22, color: paidCount === members.length ? "var(--primary)" : "var(--ink)", lineHeight: 1 }}>
                  {paidCount}/{members.length}
                </p>
              </div>
            )}
          </div>
          {bolao.prize_description && (
            <p style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>🏆 {bolao.prize_description}</p>
          )}
          {bolao.pix_key && (
            <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>PIX</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{bolao.pix_key}</p>
                {bolao.pix_name && <p style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{bolao.pix_name}</p>}
              </div>
              <CopyButton text={bolao.pix_key} label="Copiar PIX" />
            </div>
          )}
        </div>
      )}

      {/* membros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 18, letterSpacing: 0.4, color: "var(--ink)" }}>Participantes</h2>
          {isOwner && bolao.entry_fee > 0 && (
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>toque para dar baixa no pagamento</span>
          )}
        </div>
        {members.map((m) => {
          const isMe = m.user_id === user?.id;
          const isBolaoDono = m.user_id === bolao.owner_id;
          return (
            <div key={m.id}
              onClick={() => isOwner && bolao.entry_fee > 0 ? togglePaid(m.id, m.paid) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 14,
                background: isMe ? "var(--primary)" : "var(--surface)",
                border: isMe ? "none" : "1px solid var(--line)",
                color: isMe ? "var(--on-primary)" : "var(--ink)",
                cursor: isOwner && bolao.entry_fee > 0 ? "pointer" : "default",
                boxShadow: isMe ? "0 6px 16px -8px var(--primary-strong)" : "0 1px 2px rgba(26,24,20,.03)",
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: isMe ? "rgba(255,255,255,.25)" : "var(--app-bg)",
                border: isMe ? "none" : "1.5px solid var(--line-strong)",
                display: "grid", placeItems: "center",
                fontFamily: "Anton, sans-serif", fontSize: 14,
                color: isMe ? "var(--on-primary)" : "var(--ink-2)",
              }}>
                {m.profiles?.name?.slice(0, 2).toUpperCase() ?? "??"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.profiles?.name ?? "Usuário"}
                  </span>
                  {isMe && <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>· você</span>}
                  {isBolaoDono && <Crown size={13} strokeWidth={2} style={{ opacity: 0.75, flexShrink: 0 }} />}
                </div>
              </div>
              {bolao.entry_fee > 0 && (
                <div style={{
                  fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
                  background: m.paid ? (isMe ? "rgba(255,255,255,.2)" : "var(--primary-soft)") : (isMe ? "rgba(255,255,255,.1)" : "var(--app-bg)"),
                  color: m.paid ? (isMe ? "var(--on-primary)" : "var(--primary-strong)") : (isMe ? "rgba(255,255,255,.7)" : "var(--ink-3)"),
                  border: m.paid ? "none" : "1px dashed currentColor",
                }}>
                  {m.paid ? "✓ pago" : "pendente"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* sair */}
      {!isOwner && (
        <button onClick={handleSair} style={{ marginTop: 8, height: 44, borderRadius: 12, border: "1.5px solid var(--line-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13.5, color: "var(--ink-3)", cursor: "pointer" }}>
          Sair do bolão
        </button>
      )}
    </div>
  );
}
