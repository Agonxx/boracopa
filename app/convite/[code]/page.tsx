"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Bolao {
  id: string;
  name: string;
  entry_fee: number;
  memberCount: number;
}

export default function ConvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const supabase = createClient();

  const inviteCode = (code ?? "").toUpperCase();
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const [{ data: { session } }, { data: bolaoData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from("boloes").select("id, name, entry_fee").eq("invite_code", inviteCode).single(),
      ]);

      setUserId(session?.user?.id ?? null);

      if (!bolaoData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { count } = await supabase
        .from("bolao_members")
        .select("id", { count: "exact", head: true })
        .eq("bolao_id", bolaoData.id);

      setBolao({ ...bolaoData, memberCount: count ?? 0 });
      setLoading(false);
    }
    init();
  }, [inviteCode]);

  async function handleJoin() {
    if (!userId || !bolao) return;
    setJoining(true);
    const { error: err } = await supabase
      .from("bolao_members")
      .insert({ bolao_id: bolao.id, user_id: userId });

    if (err?.code === "23505") {
      router.push(`/boloes/${bolao.id}`);
      return;
    }
    if (err) {
      setError("Erro ao entrar no bolão. Tente novamente.");
      setJoining(false);
      return;
    }
    router.push(`/boloes/${bolao.id}`);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--app-bg)", color: "var(--ink)",
      fontFamily: "Archivo, sans-serif", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ textAlign: "center", fontFamily: "Anton, sans-serif", fontSize: 30, letterSpacing: 0.5 }}>
          BORA<span style={{ color: "var(--primary)" }}>COPA</span>
        </div>

        {loading ? (
          <div style={{ background: "var(--surface)", borderRadius: 20, padding: 32, textAlign: "center", fontSize: 14, color: "var(--ink-3)" }}>
            Carregando...
          </div>
        ) : notFound ? (
          <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--line)", padding: "28px 24px", textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontFamily: "Anton, sans-serif", fontSize: 20, margin: 0 }}>Link inválido</p>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0 }}>Este convite não existe ou foi removido.</p>
            <Link href="/home" style={{ color: "var(--primary-strong)", fontWeight: 700, textDecoration: "none", fontSize: 14, marginTop: 8 }}>
              Ir para a home →
            </Link>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--line)", padding: "24px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Trophy size={22} style={{ color: "var(--primary-strong)" }} strokeWidth={2} />
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: "Anton, sans-serif", fontSize: 20, letterSpacing: 0.3 }}>{bolao!.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Users size={12} strokeWidth={2} />
                  {bolao!.memberCount} participante{bolao!.memberCount !== 1 ? "s" : ""}
                  {bolao!.entry_fee > 0 && ` · R$ ${bolao!.entry_fee.toFixed(2)}`}
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", textAlign: "center", lineHeight: 1.5 }}>
              Você foi convidado para participar deste bolão da Copa 2026.
            </p>

            {error && (
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--live)", fontWeight: 600, textAlign: "center" }}>{error}</p>
            )}

            {userId ? (
              <button onClick={handleJoin} disabled={joining} style={{
                height: 52, borderRadius: 13, border: "none",
                background: "var(--primary)", color: "var(--on-primary)",
                fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16,
                cursor: joining ? "not-allowed" : "pointer",
                boxShadow: "0 5px 0 var(--primary-strong)", opacity: joining ? 0.7 : 1,
              }}>
                {joining ? "Entrando..." : "Entrar no bolão →"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href={`/register?next=/convite/${inviteCode}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 52, borderRadius: 13, border: "none",
                  background: "var(--primary)", color: "var(--on-primary)",
                  fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16,
                  textDecoration: "none", boxShadow: "0 5px 0 var(--primary-strong)",
                }}>
                  Criar conta e entrar →
                </Link>
                <Link href={`/login?next=/convite/${inviteCode}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 46, borderRadius: 13, border: "1.5px solid var(--line-strong)",
                  background: "transparent", color: "var(--ink)",
                  fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 15,
                  textDecoration: "none",
                }}>
                  Já tenho conta
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
