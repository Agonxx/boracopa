"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useBolaoStore } from "@/store/bolao";
import { usePrivacyStore } from "@/store/privacy";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/nav/Header";
import BottomNav from "@/components/nav/BottomNav";
import Wordmark from "@/components/ui/Wordmark";
import PointsPill from "@/components/ui/PointsPill";
import BolaoSwitcher from "@/components/ui/BolaoSwitcher";
import ProfileModal from "@/components/ui/ProfileModal";
import PrivacyToggle from "@/components/ui/PrivacyToggle";

function MobileHeader({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { user } = useAuthStore();
  if (!user) return null;
  return (
    <div
      className="lg:hidden sticky top-0 z-10 px-4 pb-3"
      style={{
        paddingTop: 52,
        background: "color-mix(in srgb, var(--app-bg) 88%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Link href="/home" style={{ textDecoration: "none" }}><Wordmark /></Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <PrivacyToggle size={30} />
          <PointsPill
            pts={user.pts}
            initials={user.name.slice(0, 2).toUpperCase()}
            onAvatarClick={onOpenProfile}
          />
        </div>
      </div>
      <BolaoSwitcher />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, _hydrated, setUser, setHydrated } = useAuthStore();
  const { activeBolaoId, setActiveBolao, setUserBoloes } = useBolaoStore();
  const { blurNames, setBlur } = usePrivacyStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("privacy") === "1") setBlur(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.privacy = blurNames ? "on" : "off";
  }, [blurNames]);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setHydrated(); return; }
      const [{ data: profile }, { data: memberRow }] = await Promise.all([
        supabase.from("profiles").select("id, name, is_super_admin").eq("id", session.user.id).single(),
        supabase.from("bolao_members").select("pts").eq("user_id", session.user.id).limit(1).maybeSingle(),
      ]);
      const pts = (memberRow as any)?.pts ?? 0;
      setUser({
        id: session.user.id,
        name: profile?.name ?? session.user.email?.split("@")[0] ?? "Usuário",
        email: session.user.email ?? "",
        pts,
        isSuperAdmin: profile?.is_super_admin ?? false,
      });
      setHydrated();
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); router.replace("/login"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchBoloes() {
      const { data } = await supabase
        .from("bolao_members").select("boloes(id, name)").eq("user_id", user!.id);
      const boloes = (data ?? []).map((d: any) => d.boloes).filter(Boolean) as { id: string; name: string }[];
      setUserBoloes(boloes);
      if (boloes.length > 0) {
        const stillValid = activeBolaoId && boloes.some(b => b.id === activeBolaoId);
        if (!stillValid) setActiveBolao(boloes[0].id, boloes[0].name);
      }
    }
    fetchBoloes();
  }, [user?.id]);

  if (!_hydrated || !user) {
    if (_hydrated && !user) router.replace("/login");
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Desktop header */}
      <Header user={user} onOpenProfile={() => setProfileOpen(true)} />

      {/* Mobile header */}
      <MobileHeader onOpenProfile={() => setProfileOpen(true)} />

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto pb-[60px] lg:pb-0" style={{ background: "var(--app-bg)" }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav isAdmin={user.isSuperAdmin} />

      {/* Profile modal (mobile sheet + desktop modal) */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
