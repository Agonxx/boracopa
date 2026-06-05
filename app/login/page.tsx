"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";

/* ── Escudo hexagonal com raio ── */
function Crest({ size = 84 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, filter: "drop-shadow(0 10px 22px rgba(0,0,0,.22))" }}>
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(150deg, var(--primary) 0%, var(--primary-strong) 100%)",
        clipPath: "polygon(50% 0, 100% 18%, 100% 62%, 50% 100%, 0 62%, 0 18%)",
        display: "grid", placeItems: "center",
      }}>
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="var(--on-primary)" stroke="none">
          <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
        </svg>
      </div>
    </div>
  );
}

/* ── Campo de input ── */
function Field({
  label, iconPath, value, onChange, placeholder,
  type = "text", trailing, error, autoFocus,
}: {
  label: string; iconPath: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  type?: string; trailing?: React.ReactNode;
  error?: boolean; autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-2)" }}>
        {label}
      </span>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 52,
        background: "var(--surface)", borderRadius: 14,
        border: `1.6px solid ${error ? "var(--live)" : focus ? "var(--primary-strong)" : "var(--line-strong)"}`,
        boxShadow: focus && !error ? "0 0 0 3px var(--primary-soft)" : "none",
        transition: "all .14s",
      }}>
        <svg width={19} height={19} viewBox="0 0 24 24" fill="none"
          stroke={error ? "var(--live)" : "var(--ink-3)"} strokeWidth={1.9}
          strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
        <input
          type={type} value={value} placeholder={placeholder} autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none",
            background: "transparent", fontFamily: "Archivo, sans-serif",
            fontSize: 15.5, fontWeight: 500, color: "var(--ink)",
            letterSpacing: type === "password" ? 3 : 0,
          }}
        />
        {trailing}
      </div>
    </label>
  );
}

/* ── Formulário (compartilhado mobile + desktop) ── */
function LoginForm({ error, onSubmit }: { error: boolean; onSubmit: (u: string, p: string) => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(user, pass);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field
        label="E-mail"
        iconPath="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        type="email"
        value={user} onChange={setUser} placeholder="seu@email.com" autoFocus
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Field
          label="Senha"
          iconPath="M18 11V8a6 6 0 0 0-12 0v3M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
          type={show ? "text" : "password"}
          value={pass} onChange={setPass} placeholder="••••••••" error={error}
          trailing={
            <button type="button" onClick={() => setShow((s) => !s)}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "grid", placeItems: "center", color: "var(--ink-3)" }}>
              {show ? <EyeOff size={19} strokeWidth={1.8} /> : <Eye size={19} strokeWidth={1.8} />}
            </button>
          }
        />
        {error && (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--live)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 15, height: 15, borderRadius: "50%", background: "var(--live)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>!</span>
            Usuário ou senha incorretos. Tente de novo.
          </span>
        )}
      </div>

      <button type="submit" style={{
        height: 54, marginTop: 4, border: "none", borderRadius: 14,
        background: "var(--primary)", color: "var(--on-primary)",
        fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16,
        cursor: "pointer", boxShadow: "0 5px 0 var(--primary-strong)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        Entrar
        <svg width={19} height={19} viewBox="0 0 24 24" fill="none"
          stroke="var(--on-primary)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
        Ainda não tem conta? <b style={{ color: "var(--ink)" }}>Cadastre-se.</b>
      </div>
    </form>
  );
}

/* ── Mobile ── */
function LoginMobile({ error, onSubmit }: { error: boolean; onSubmit: (u: string, p: string) => void }) {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--app-bg)", color: "var(--ink)", fontFamily: "Archivo, sans-serif", position: "relative" }}>
      {/* banda de marca */}
      <div style={{ background: "var(--hero-bg)", color: "var(--hero-ink)", padding: "92px 26px 40px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: "repeating-linear-gradient(115deg, transparent 0 26px, var(--hero-stripe) 26px 27px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <Crest size={78} />
          <div>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 44, letterSpacing: 0.5, lineHeight: 0.92 }}>
              <span>BORA</span><span style={{ color: "var(--primary)" }}>COPA</span>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--hero-dim)", marginTop: 8, fontWeight: 500 }}>
              o bolão dos amigos · Copa 2026
            </div>
          </div>
        </div>
      </div>

      {/* card sobreposto */}
      <div style={{ flex: 1, marginTop: -22, position: "relative", zIndex: 2 }}>
        <div style={{ background: "var(--app-bg)", borderRadius: "24px 24px 0 0", padding: "26px 22px 24px" }}>
          <h2 style={{ margin: "0 0 18px", fontFamily: "Anton, sans-serif", fontSize: 23, letterSpacing: 0.3 }}>
            Entrar
          </h2>
          <LoginForm error={error} onSubmit={onSubmit} />
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-3)", padding: "6px 0 26px", fontWeight: 600 }}>
        BoraCopa · Copa 2026
      </div>
    </div>
  );
}

/* ── Desktop (split) ── */
function LoginDesktop({ error, onSubmit }: { error: boolean; onSubmit: (u: string, p: string) => void }) {
  return (
    <div style={{ height: "100%", display: "flex", background: "var(--app-bg)", color: "var(--ink)", fontFamily: "Archivo, sans-serif" }}>
      {/* painel esquerdo */}
      <div style={{ width: "46%", background: "var(--hero-bg)", color: "var(--hero-ink)", padding: "48px 46px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: "repeating-linear-gradient(115deg, transparent 0 30px, var(--hero-stripe) 30px 31px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <Crest size={46} />
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 26, letterSpacing: 0.5 }}>
            <span>BORA</span><span style={{ color: "var(--primary)" }}>COPA</span>
          </div>
        </div>
        <div style={{ position: "relative", marginTop: "auto" }}>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 46, lineHeight: 0.98, letterSpacing: 0.4 }}>
            O BOLÃO DA<br />GALERA NA<br /><span style={{ color: "var(--primary)" }}>COPA 2026</span>
          </div>
          <div style={{ fontSize: 15, color: "var(--hero-dim)", marginTop: 16, maxWidth: 320, lineHeight: 1.5 }}>
            Palpite nos jogos, crave o placar e dispute o ranking com os amigos. Crie sua conta grátis.
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 28 }}>
            {([["64", "jogos"], ["128", "no bolão"], ["+5", "cravada"]] as const).map(([v, k]) => (
              <div key={k}>
                <div style={{ fontFamily: "Anton, sans-serif", fontSize: 30, color: "var(--hero-ink)", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12, color: "var(--hero-dim)", fontWeight: 600, marginTop: 2 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* formulário direito */}
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h1 style={{ margin: "0 0 4px", fontFamily: "Anton, sans-serif", fontSize: 30, letterSpacing: 0.3 }}>
            Bem-vindo de volta
          </h1>
          <p style={{ margin: "0 0 26px", fontSize: 14, color: "var(--ink-2)" }}>
            Entre para palpitar a próxima rodada.
          </p>
          <LoginForm error={error} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function LoginPage() {
  const [error, setError] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  function handleSubmit(username: string, password: string) {
    const ok = login(username, password);
    if (ok) router.replace("/home");
    else setError(true);
  }

  return (
    <div className="h-full">
      {/* mobile */}
      <div className="lg:hidden h-full">
        <LoginMobile error={error} onSubmit={handleSubmit} />
      </div>
      {/* desktop */}
      <div className="hidden lg:block h-full">
        <LoginDesktop error={error} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
