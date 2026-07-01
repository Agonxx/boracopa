"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const card: React.CSSProperties = {
  background: "var(--surface)", borderRadius: 18, border: "1px solid var(--line)",
  padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12,
};
const label: React.CSSProperties = {
  fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: 1.2,
  textTransform: "uppercase", color: "var(--ink-3)", margin: 0,
};
const li: React.CSSProperties = {
  fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, paddingLeft: 4,
};

export default function RegrasPage() {
  const router = useRouter();

  return (
    <div style={{ padding: "14px 16px 48px", maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, fontFamily: "Archivo, sans-serif" }}>
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", padding: 0, width: "fit-content" }}>
        <ChevronLeft size={16} strokeWidth={2} /> Voltar
      </button>

      <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 26, letterSpacing: 0.3, color: "var(--ink)", margin: 0 }}>REGRAS DO BOLÃO</h1>

      {/* Pontuação */}
      <div style={card}>
        <p style={label}>Pontuação por jogo</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { title: "Cravada", pts: "+5 pts", desc: "Acertou o placar exato", color: "var(--primary-strong)", bg: "var(--primary-soft)" },
            { title: "Acerto", pts: "+3 pts", desc: "Acertou quem ganhou ou empate", color: "#2e7d32", bg: "#e8f5e9" },
            { title: "Errou", pts: "0 pts", desc: "Resultado diferente do palpite", color: "var(--ink-3)", bg: "var(--app-bg)" },
          ].map(({ title, pts, desc, color, bg }) => (
            <div key={title} style={{ background: bg, borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: "Anton, sans-serif", fontSize: 22, color, lineHeight: 1 }}>{pts}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color }}>{title}</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.4 }}>{desc}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>
          Exemplo: jogo termina 2 × 1. Quem palpitou 2 × 1 crava (+5). Quem palpitou 3 × 1 acerta (+3). Quem palpitou 1 × 2 erra (0).
        </p>
      </div>

      {/* Como funciona */}
      <div style={card}>
        <p style={label}>Como funciona</p>
        <ol style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Registre seu palpite no placar de cada jogo antes do início.",
            "Os palpites fecham automaticamente no horário de início da partida.",
            "Após o apito final, o ADM publica o resultado e os pontos são distribuídos.",
            "Acompanhe sua posição no ranking geral ou por fase.",
          ].map((t, i) => <li key={i} style={li}>{t}</li>)}
        </ol>
      </div>

      {/* Regras */}
      <div style={card}>
        <p style={label}>Regras importantes</p>
        <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Não é possível alterar o palpite após o encerramento do jogo.",
            "Jogos sem palpite valem 0 pontos — não há penalidade por não palpitar.",
            "Em caso de empate no ranking, quem tem mais cravadas fica melhor posicionado.",
            "Na fase mata-mata, em jogos empatados você também pode palpitar quem avança nos pênaltis.",
          ].map((t, i) => <li key={i} style={li}>{t}</li>)}
        </ul>
      </div>

      {/* Mata-mata */}
      <div style={card}>
        <p style={label}>Mata-mata</p>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
          Nos jogos eliminatórios, a pontuação é sobre o resultado ao fim do <strong>tempo regulamentar + prorrogação</strong> (antes dos pênaltis).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Cravada +5 pts", desc: "Acertou o placar exato ao fim do tempo regulamentar/prorrogação.", color: "var(--primary-strong)", bg: "var(--primary-soft)" },
            { label: "Acerto +3 pts", desc: "Acertou quem venceu no tempo regulamentar/prorrogação, ou que o jogo foi para os pênaltis (empate após prorrogação).", color: "#2e7d32", bg: "#e8f5e9" },
            { label: "Erro 0 pts", desc: "Resultado diferente do seu palpite.", color: "var(--ink-3)", bg: "var(--app-bg)" },
          ].map(({ label: l, desc, color, bg }) => (
            <div key={l} style={{ background: bg, borderRadius: 12, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontFamily: "Anton, sans-serif", fontSize: 14, color }}>{l}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>
          Exemplo: jogo vai para prorrogação e termina 1×1. Quem palpitou 1×1 crava (+5). Quem palpitou 0×0 ou 2×2 acerta (+3, pois acertou o empate). Quem palpitou 2×1 erra (0).
        </p>
      </div>

      {/* Ranking */}
      <div style={card}>
        <p style={label}>Ranking</p>
        <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Geral: soma de todos os pontos da Copa.",
            "Fase de grupos: pontos acumulados apenas nos 48 jogos da fase de grupos.",
            "Mata-mata: pontos das oitavas, quartas, semifinal e final.",
          ].map((t, i) => <li key={i} style={li}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}
