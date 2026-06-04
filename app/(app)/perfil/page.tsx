"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function PerfilPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <h1 className="font-display text-3xl uppercase tracking-wide" style={{ color: "var(--ink)" }}>
        Perfil
      </h1>
      {user && (
        <div
          className="mt-4 p-4 rounded-2xl flex flex-col gap-2"
          style={{ background: "var(--surface)" }}
        >
          <p className="font-semibold" style={{ color: "var(--ink)" }}>{user.name}</p>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>
            {user.sector} · {user.pts} pts {user.isAdmin && "· ADM"}
          </p>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="mt-6 w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: "var(--live-soft)", color: "var(--live)" }}
      >
        Sair da conta
      </button>
    </div>
  );
}
