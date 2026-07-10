"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacyStore } from "@/store/privacy";

export default function PrivacyToggle({ size = 34 }: { size?: number }) {
  const { blurNames, toggle } = usePrivacyStore();
  return (
    <button
      onClick={toggle}
      title={blurNames ? "Mostrar nomes" : "Ocultar nomes (modo gravação)"}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: "1px solid var(--line-strong)",
        background: blurNames ? "var(--primary-soft)" : "var(--surface)",
        color: blurNames ? "var(--primary-strong)" : "var(--ink-2)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}
    >
      {blurNames ? <EyeOff size={size * 0.44} strokeWidth={2.2} /> : <Eye size={size * 0.44} strokeWidth={2.2} />}
    </button>
  );
}
