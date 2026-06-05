"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/nav/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import Wordmark from "@/components/ui/Wordmark";
import PointsPill from "@/components/ui/PointsPill";

function MobileHeader() {
  const { user } = useAuthStore();
  if (!user) return null;
  const initials = user.name.slice(0, 2).toUpperCase();
  return (
    <div
      className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 pb-3"
      style={{
        paddingTop: 52,
        background: "color-mix(in srgb, var(--app-bg) 88%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      } as React.CSSProperties}
    >
      <Wordmark />
      <div style={{ marginLeft: "auto" }}>
        <PointsPill pts={user.pts} initials={initials} />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, _hydrated, setUser, setHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setHydrated();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, is_super_admin")
        .eq("id", session.user.id)
        .single();

      setUser({
        id: session.user.id,
        name: profile?.name ?? session.user.email?.split("@")[0] ?? "Usuário",
        email: session.user.email ?? "",
        pts: 0,
        isSuperAdmin: profile?.is_super_admin ?? false,
      });
      setHydrated();
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!_hydrated) return null;

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-h-full overflow-hidden">
        <MobileHeader />
        <main
          className="flex-1 overflow-y-auto pb-[60px] lg:pb-0"
          style={{ background: "var(--app-bg)" }}
        >
          {children}
        </main>
      </div>
      <BottomNav isAdmin={user.isSuperAdmin} />
    </div>
  );
}
