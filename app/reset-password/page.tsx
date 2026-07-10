"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function Crest({ size = 72 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, filter: "drop-shadow(0 8px 18px rgba(0,0,0,.22))" }}>
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

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push("/home"), 2500);
  }

  const inputBase: React.CSSProperties = {
    height: 50, padding: "0 44px 0 14px", borderRadius: 12,
    border: "1.5px solid var(--line-strong)", background: "var(--surface)",
    fontFamily: "Archivo, sans-serif", fontSize: 15, color: "var(--ink)",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", background: "var(--app-bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <Crest />

        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 26, letterSpacing: 0.4, color: "var(--ink)", margin: "0 0 6px" }}>
            {done ? "Senha alterada!" : "Nova senha"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0 }}>
            {done
              ? "Redirecionando para o app..."
              : !ready
                ? "Verificando o link de redefinição..."
                : "Digite sua nova senha abaixo."}
          </p>
        </div>

        {!done && ready && (
          <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{ background: "#fff0f0", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, color: "#c0392b" }}>
                {error}
              </div>
            )}

            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Nova senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputBase}
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 0, display: "grid", placeItems: "center" }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showCf ? "text" : "password"}
                placeholder="Confirmar nova senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={inputBase}
              />
              <button type="button" onClick={() => setShowCf(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 0, display: "grid", placeItems: "center" }}>
                {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={saving || !password || !confirm}
              style={{
                height: 52, borderRadius: 13, border: "none",
                background: "var(--primary)", color: "var(--on-primary)",
                fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16,
                cursor: saving ? "default" : "pointer",
                boxShadow: "0 4px 0 var(--primary-strong)",
                opacity: (!password || !confirm) ? 0.6 : 1,
                transition: "opacity .12s",
              }}>
              {saving ? "Salvando..." : "Salvar nova senha →"}
            </button>
          </form>
        )}

        {!ready && !done && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--line-strong)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
        )}
      </div>
    </div>
  );
}
