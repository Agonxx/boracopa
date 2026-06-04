"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
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
  const { user, _hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && !user) router.replace("/login");
  }, [user, _hydrated, router]);

  if (!_hydrated || !user) return null;

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
      <BottomNav isAdmin={user.isAdmin} />
    </div>
  );
}
