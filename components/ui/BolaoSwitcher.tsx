"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trophy, Plus } from "lucide-react";
import { useBolaoStore } from "@/store/bolao";

export default function BolaoSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeBolaoId, activeBolaoName, userBoloes, setActiveBolao } = useBolaoStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const label = activeBolaoName ?? "Sem bolão";
  const hasActive = !!activeBolaoId;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          height: compact ? 30 : 34,
          padding: compact ? "0 10px" : "0 12px",
          borderRadius: 30, cursor: "pointer",
          border: `1.5px solid ${hasActive ? "var(--primary-strong)" : "var(--line-strong)"}`,
          background: hasActive ? "var(--primary-soft)" : "var(--surface)",
          fontFamily: "Archivo, sans-serif", fontWeight: 700,
          fontSize: compact ? 12 : 13,
          color: hasActive ? "var(--primary-strong)" : "var(--ink-3)",
          maxWidth: compact ? 140 : 180,
          whiteSpace: "nowrap", overflow: "hidden",
        }}
      >
        <Trophy size={compact ? 12 : 14} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1, textAlign: "left" }}>{label}</span>
        <ChevronDown size={12} strokeWidth={2.4} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "var(--surface)", borderRadius: 14,
          border: "1px solid var(--line-strong)",
          boxShadow: "0 8px 24px -8px rgba(0,0,0,.18)",
          minWidth: 200, maxWidth: 260,
          padding: 6, display: "flex", flexDirection: "column", gap: 2,
        }}>
          {userBoloes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", padding: "8px 10px", margin: 0 }}>Nenhum bolão ainda.</p>
          ) : (
            userBoloes.map((b) => {
              const isActive = b.id === activeBolaoId;
              return (
                <button key={b.id} onClick={() => { setActiveBolao(b.id, b.name); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
                    borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                    background: isActive ? "var(--primary)" : "transparent",
                    color: isActive ? "var(--on-primary)" : "var(--ink)",
                    fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13.5,
                  }}>
                  <Trophy size={14} strokeWidth={2} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                  {isActive && <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.8 }}>ativo</span>}
                </button>
              );
            })
          )}

          <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />

          <button onClick={() => { router.push("/boloes"); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink-2)" }}>
            <Plus size={14} strokeWidth={2.4} />
            Gerenciar bolões
          </button>
        </div>
      )}
    </div>
  );
}
