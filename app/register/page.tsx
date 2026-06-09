"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function Crest({ size = 84 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, filter: "drop-shadow(0 10px 22px rgba(0,0,0,.22))" }}>
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(150deg, var(--primary) 0%, var(--primary-strong) 100%)", clipPath: "polygon(50% 0, 100% 18%, 100% 62%, 50% 100%, 0 62%, 0 18%)", display: "grid", placeItems: "center" }}>
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="var(--on-primary)" stroke="none">
          <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
        </svg>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, trailing, error }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder: string; trailing?: React.ReactNode; error?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-2)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 52, background: "var(--surface)", borderRadius: 14, border: `1.6px solid ${error ? "var(--live)" : focus ? "var(--primary-strong)" : "var(--line-strong)"}`, boxShadow: focus && !error ? "0 0 0 3px var(--primary-soft)" : "none", transition: "all .14s" }}>
        <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "Archivo, sans-serif", fontSize: 15.5, fontWeight: 500, color: "var(--ink)" }} />
        {trailing}
      </div>
    </label>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Erro ao criar conta. Tente novamente.");
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next ?? "/home";
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* banda de marca */}
      <div className="flex flex-col items-center justify-center gap-4 px-8 py-12 lg:w-[46%] lg:min-h-full relative overflow-hidden" style={{ background: "var(--hero-bg)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--hero-stripe) 0px, var(--hero-stripe) 1px, transparent 1px, transparent 24px)" }} />
        <Crest size={78} />
        <div className="relative z-10 font-display text-5xl tracking-wide uppercase leading-none">
          <span style={{ color: "var(--hero-ink)" }}>BORA</span><span style={{ color: "var(--primary)" }}>COPA</span>
        </div>
        <p className="relative z-10 text-sm tracking-widest uppercase" style={{ color: "var(--hero-dim)" }}>
          o bolão dos amigos · Copa 2026
        </p>
      </div>

      {/* formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h1 style={{ margin: "0 0 4px", fontFamily: "Anton, sans-serif", fontSize: 30, letterSpacing: 0.3 }}>Criar conta</h1>
          <p style={{ margin: "0 0 26px", fontSize: 14, color: "var(--ink-2)" }}>Grátis. Crie um bolão ou entre em um.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome" value={name} onChange={setName} placeholder="Seu nome" />
            <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
            <Field
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={password} onChange={setPassword} placeholder="mín. 6 caracteres"
              error={!!error}
              trailing={
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "grid", placeItems: "center", color: "var(--ink-3)" }}>
                  {showPassword ? <EyeOff size={19} strokeWidth={1.8} /> : <Eye size={19} strokeWidth={1.8} />}
                </button>
              }
            />
            {error && (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--live)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 15, height: 15, borderRadius: "50%", background: "var(--live)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>!</span>
                {error}
              </span>
            )}

            <button type="submit" disabled={loading} style={{ height: 54, marginTop: 4, border: "none", borderRadius: 14, background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 5px 0 var(--primary-strong)", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? "Criando conta..." : "Criar conta →"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
              Já tem conta?{" "}
              <Link href="/login" style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "none" }}>Entrar.</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
