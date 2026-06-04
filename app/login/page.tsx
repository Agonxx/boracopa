"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(username, password);
    if (ok) {
      router.replace("/home");
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* Banda de marca */}
      <div
        className="flex flex-col items-center justify-center gap-4 px-8 py-12 lg:w-[46%] lg:min-h-full relative overflow-hidden"
        style={{ background: "var(--hero-bg)" }}
      >
        {/* textura de listras */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--hero-stripe) 0px, var(--hero-stripe) 1px, transparent 1px, transparent 24px)",
          }}
        />
        {/* escudo */}
        <div
          className="relative z-10 w-16 h-16 flex items-center justify-center rounded-2xl text-2xl font-display"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          ⚽
        </div>
        {/* wordmark */}
        <div className="relative z-10 font-display text-5xl tracking-wide uppercase leading-none">
          <span style={{ color: "var(--hero-ink)" }}>BORA</span>
          <span style={{ color: "var(--primary)" }}>COPA</span>
        </div>
        <p
          className="relative z-10 text-sm tracking-widest uppercase"
          style={{ color: "var(--hero-dim)" }}
        >
          o bolão da firma · Copa 2026
        </p>

        {/* stats — desktop only */}
        <div className="relative z-10 hidden lg:flex gap-10 mt-8">
          {[
            { n: "32", label: "Participantes" },
            { n: "64", label: "Jogos" },
            { n: "+5", label: "Pts placar cravado" },
          ].map(({ n, label }) => (
            <div key={label} className="text-center">
              <div
                className="font-display text-3xl tracking-wide"
                style={{ color: "var(--hero-ink)" }}
              >
                {n}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--hero-dim)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 bg-app-bg lg:bg-surface">
        <div
          className="w-full max-w-sm rounded-3xl rounded-tl-3xl p-8"
          style={{ background: "var(--surface)" }}
        >
          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--ink)" }}
          >
            Entrar
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Usuário */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
                Usuário de rede
              </label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
                style={{
                  border: `1.5px solid ${error ? "var(--live)" : "var(--line-strong)"}`,
                }}
              >
                <User size={16} style={{ color: "var(--ink-3)" }} />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(false); }}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--ink)" }}
                  placeholder="seu.usuario"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
                Senha
              </label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
                style={{
                  border: `1.5px solid ${error ? "var(--live)" : "var(--line-strong)"}`,
                }}
              >
                <Lock size={16} style={{ color: "var(--ink-3)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--ink)" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="p-0.5"
                  style={{ color: "var(--ink-3)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <p className="text-xs mt-1" style={{ color: "var(--live)" }}>
                  Usuário ou senha incorretos.
                </p>
              )}
            </div>

            {/* Botão */}
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl font-semibold text-sm transition-opacity active:opacity-80"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
                boxShadow: "0 5px 0 var(--primary-strong)",
              }}
            >
              Entrar →
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: "var(--ink-3)" }}>
            Problemas pra entrar?{" "}
            <span className="font-semibold" style={{ color: "var(--ink-2)" }}>
              Fale com o ADM.
            </span>
          </p>

          {/* Dica de mock */}
          <div
            className="mt-6 p-3 rounded-xl text-xs text-center"
            style={{ background: "var(--primary-soft)", color: "var(--ink-2)" }}
          >
            <strong>Modo mock:</strong> qualquer usuário/senha entra. Use{" "}
            <strong>adm / adm123</strong> para acessar como ADM.
          </div>
        </div>
      </div>
    </div>
  );
}
