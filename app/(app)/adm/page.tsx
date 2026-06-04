"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdmPage() {
  const { user, _hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && user && !user.isAdmin) router.replace("/home");
  }, [user, _hydrated, router]);

  if (!_hydrated || !user?.isAdmin) return null;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl uppercase tracking-wide" style={{ color: "var(--ink)" }}>
        Central ADM
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
        Cadastrar jogos e lançar resultados — em breve.
      </p>
    </div>
  );
}
