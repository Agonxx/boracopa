interface AvatarProps {
  initials?: string;
  size?: number;
  ring?: boolean;
  onClick?: () => void;
}

export default function Avatar({ initials = "AM", size = 30, ring, onClick }: AvatarProps) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)",
        display: "grid", placeItems: "center", color: "var(--on-primary)",
        fontFamily: "Anton, sans-serif", fontSize: size * 0.42,
        boxShadow: ring ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {initials}
    </div>
  );
}
