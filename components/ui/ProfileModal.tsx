"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ChevronRight, X, Shield, Pencil, Check } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";

interface Stats { palpites: number; cravadas: number }

function useIsDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return v;
}

function Body({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ palpites: 0, cravadas: 0 });
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const [{ count: p }, { count: c }] = await Promise.all([
        supabase.from("predictions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("predictions").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("pts_earned", 5),
      ]);
      setStats({ palpites: p ?? 0, cravadas: c ?? 0 });
    }
    fetch();
  }, [user?.id]);

  if (!user) return null;

  const initials = user.name.slice(0, 2).toUpperCase();
  const aprov = stats.palpites > 0
    ? `${Math.round((stats.cravadas / stats.palpites) * 100)}%`
    : "–";

  const statItems = [
    { v: `${user.pts}`, k: "pontos" },
    { v: `${stats.palpites}`, k: "palpites" },
    { v: `${stats.cravadas}`, k: "cravados" },
    { v: aprov, k: "aproveit." },
  ];

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user!.name) { setEditingName(false); return; }
    setSavingName(true);
    await supabase.from("profiles").update({ name: trimmed }).eq("id", user!.id);
    useAuthStore.setState(s => ({ user: s.user ? { ...s.user, name: trimmed } : null }));
    setSavingName(false);
    setEditingName(false);
  }

  async function handleLogout() {
    onClose();
    await logout();
    window.location.href = "/login";
  }

  function go(href: string) { onClose(); router.push(href); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "Archivo, sans-serif" }}>
      {/* identidade */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)", display: "grid", placeItems: "center", color: "var(--on-primary)", fontFamily: "Anton, sans-serif", fontSize: 22 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                maxLength={40}
                style={{ flex: 1, height: 32, padding: "0 10px", borderRadius: 8, border: "1.5px solid var(--primary-strong)", background: "var(--surface)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)", outline: "none", minWidth: 0 }}
              />
              <button onClick={handleSaveName} disabled={savingName} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "var(--primary)", color: "var(--on-primary)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Check size={14} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => { setNameValue(user.name); setEditingName(true); }}>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.2, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <Pencil size={13} strokeWidth={2} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", borderRadius: 30, padding: "6px 12px", flexShrink: 0 }}>
          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: "var(--primary-strong)", lineHeight: 1 }}>{user.pts}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--primary-strong)", textTransform: "uppercase", letterSpacing: 0.5 }}>pts</span>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {statItems.map((s) => (
          <div key={s.k} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 24, lineHeight: 1, color: "var(--ink)" }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--ink-2)", fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* ranking */}
      <button onClick={() => go("/ranking")} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontFamily: "Archivo, sans-serif" }}>
        <Trophy size={18} strokeWidth={2} style={{ color: "var(--primary-strong)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--ink)", textAlign: "left" }}>Ver minha posição no ranking</span>
        <ChevronRight size={16} strokeWidth={2} style={{ color: "var(--ink-3)" }} />
      </button>

      {/* ADM — só super admin */}
      {user.isSuperAdmin && (
        <button onClick={() => go("/adm")} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "var(--primary-soft)", border: "none", borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontFamily: "Archivo, sans-serif" }}>
          <Shield size={18} strokeWidth={2} style={{ color: "var(--primary-strong)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--primary-strong)", textAlign: "left" }}>Central ADM</span>
          <ChevronRight size={16} strokeWidth={2} style={{ color: "var(--primary-strong)" }} />
        </button>
      )}

      {/* sair */}
      <button onClick={handleLogout} style={{ width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer", background: "transparent", border: "1px solid var(--line-strong)", color: "var(--ink-2)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14 }}>
        Sair da conta
      </button>
    </div>
  );
}

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  if (isDesktop) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,18,14,.5)" }} />
      <div style={{ position: "relative", width: 420, maxWidth: "90vw", background: "var(--app-bg)", borderRadius: 22, padding: "22px 24px 24px", boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 17, letterSpacing: 0.3, color: "var(--ink)" }}>PERFIL</div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--line-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--ink-2)" }}>
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
        <Body onClose={onClose} />
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,18,14,.5)" }} />
      <div style={{ position: "relative", background: "var(--app-bg)", borderRadius: "26px 26px 0 0", padding: "12px 18px 32px", boxShadow: "0 -16px 40px -16px rgba(0,0,0,.4)" }}>
        <div style={{ width: 42, height: 5, borderRadius: 4, background: "var(--line-strong)", margin: "0 auto 16px" }} />
        <Body onClose={onClose} />
      </div>
    </div>
  );
}
