"use client";

import Avatar from "./Avatar";

export default function PointsPill({
  pts = 128,
  initials = "AM",
  showAvatar = true,
  onAvatarClick,
}: {
  pts?: number;
  initials?: string;
  showAvatar?: boolean;
  onAvatarClick?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface)", border: "1px solid var(--line-strong)",
        borderRadius: 30, padding: showAvatar ? "5px 6px 5px 12px" : "6px 14px",
      }}
    >
      <span style={{ fontFamily: "Anton, sans-serif", fontSize: 17, color: "var(--ink)", lineHeight: 1 }}>{pts}</span>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-2)", letterSpacing: 0.5, textTransform: "uppercase" }}>pts</span>
      {showAvatar && (
        <Avatar size={26} initials={initials} onClick={onAvatarClick} />
      )}
    </div>
  );
}
