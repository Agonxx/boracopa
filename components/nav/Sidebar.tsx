"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Ticket, Trophy, User, Shield } from "lucide-react";
import Wordmark from "@/components/ui/Wordmark";
import BolaoSwitcher from "@/components/ui/BolaoSwitcher";
import type { User as UserType } from "@/store/auth";

const baseItems = [
  { href: "/home",     label: "Início",   icon: Home   },
  { href: "/boloes",   label: "Bolões",   icon: Users  },
  { href: "/palpites", label: "Palpites", icon: Ticket },
  { href: "/ranking",  label: "Ranking",  icon: Trophy },
  { href: "/perfil",   label: "Perfil",   icon: User   },
];

export default function Sidebar({ user }: { user: UserType }) {
  const pathname = usePathname();
  const items = user.isSuperAdmin
    ? [...baseItems, { href: "/adm", label: "Central ADM", icon: Shield }]
    : baseItems;

  return (
    <aside className="hidden lg:flex flex-col w-[244px] min-h-full shrink-0 py-8 px-4"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--line)" }}>
      <div className="px-3 mb-3"><Wordmark /></div>

      {/* bolão switcher */}
      <div className="px-3 mb-6">
        <BolaoSwitcher compact />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={active
                ? { background: "var(--primary)", color: "var(--on-primary)", boxShadow: "0 3px 0 var(--primary-strong)" }
                : { color: "var(--ink-2)" }}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.9} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 px-3 py-3 rounded-xl mt-4" style={{ background: "var(--app-bg)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{user.name}</p>
          <p className="text-xs truncate" style={{ color: "var(--ink-3)" }}>
            {user.pts} pts{user.isSuperAdmin ? " · Super ADM" : ""}
          </p>
        </div>
      </div>
    </aside>
  );
}
