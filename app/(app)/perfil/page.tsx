"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  palpites: number;
  cravadas: number;
  aproveitamento: string;
  pts: number;
}

export default function PerfilPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ palpites: 0, cravadas: 0, aproveitamento: "–", pts: 0 });

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      const [{ count: totalPalpites }, { data: memberData }] = await Promise.all([
        supabase.from("predictions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("bolao_members").select("pts, cravadas").eq("user_id", user!.id),
      ]);
      const total = totalPalpites ?? 0;
      const totalPts = (memberData ?? []).reduce((s, m) => s + (m.pts ?? 0), 0);
      const totalCrv = (memberData ?? []).reduce((s, m) => s + (m.cravadas ?? 0), 0);
      const aprov = total > 0 ? `${Math.round((totalCrv / total) * 100)}%` : "–";
      setStats({ palpites: total, cravadas: totalCrv, aproveitamento: aprov, pts: totalPts });
    }
    fetchStats();
  }, [user?.id]);

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  if (!user) return null;

  const initials = user.name.slice(0, 2).toUpperCase();
  const statItems = [
    { v: `${stats.pts}`, k: "pontos" },
    { v: `${stats.palpites}`, k: "palpites" },
    { v: `${stats.cravadas}`, k: "placar cravado" },
    { v: stats.aproveitamento, k: "aproveitamento" },
  ];

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "Archivo, sans-serif" }}>
      {/* identidade */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)", display: "grid", placeItems: "center", color: "var(--on-primary)", fontFamily: "Anton, sans-serif", fontSize: 23 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.2, color: "var(--ink)" }}>{user.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}{user.isSuperAdmin ? " · Super ADM" : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary-soft)", borderRadius: 30, padding: "7px 13px", flexShrink: 0 }}>
          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 19, color: "var(--primary-strong)", lineHeight: 1 }}>{stats.pts}</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--primary-strong)", textTransform: "uppercase", letterSpacing: 0.5 }}>pts</span>
        </div>
      </div>

      {/* stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {statItems.map((s) => (
          <div key={s.k} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 26, lineHeight: 1, color: "var(--ink)" }}>{s.v}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* ranking */}
      <button onClick={() => router.push("/ranking")} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 14, padding: "13px 15px", cursor: "pointer", fontFamily: "Archivo, sans-serif" }}>
        <Trophy size={20} strokeWidth={2} style={{ color: "var(--primary-strong)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Ver minha posição no ranking</span>
        <ChevronRight size={18} strokeWidth={2} style={{ color: "var(--ink-3)" }} />
      </button>

      {/* sair */}
      <button onClick={handleLogout} style={{ width: "100%", padding: "13px", borderRadius: 14, cursor: "pointer", background: "transparent", border: "1px solid var(--line-strong)", color: "var(--ink-2)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14 }}>
        Sair da conta
      </button>
    </div>
  );

  return (
    <>
      {/* mobile — page normal */}
      <div className="lg:hidden p-4" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 22, letterSpacing: 0.3, color: "var(--ink)", marginBottom: 20 }}>PERFIL</h1>
        {body}
      </div>

      {/* desktop — card centralizado */}
      <div className="hidden lg:flex" style={{ minHeight: "100%", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 420, background: "var(--app-bg)", borderRadius: 22, padding: "22px 24px 24px", boxShadow: "0 8px 32px -12px rgba(0,0,0,.18)", border: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 18, letterSpacing: 0.3, color: "var(--ink)", marginBottom: 16 }}>PERFIL</div>
          {body}
        </div>
      </div>
    </>
  );
}
