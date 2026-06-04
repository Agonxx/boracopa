"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Sidebar from "@/components/nav/Sidebar";
import BottomNav from "@/components/nav/BottomNav";

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
