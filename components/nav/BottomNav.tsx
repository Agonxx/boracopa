"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Ticket, Trophy, User, Shield } from "lucide-react";

const baseItems = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/palpites", label: "Palpites", icon: Ticket },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...baseItems, { href: "/adm", label: "ADM", icon: Shield }]
    : baseItems;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex items-center justify-around px-2 pb-safe z-50 lg:hidden"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        height: "60px",
      }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1 min-w-[44px] min-h-[44px] justify-center"
            style={{ color: active ? "var(--primary)" : "var(--ink-3)" }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.9} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
