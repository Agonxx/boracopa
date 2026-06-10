"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/ui/Wordmark";
import BolaoSwitcher from "@/components/ui/BolaoSwitcher";
import PointsPill from "@/components/ui/PointsPill";
import Avatar from "@/components/ui/Avatar";
import type { User } from "@/store/auth";

const navItems = [
  { href: "/home",     label: "Início"   },
  { href: "/boloes",   label: "Bolões"   },
  { href: "/palpites", label: "Palpites" },
  { href: "/ranking",  label: "Ranking"  },
  { href: "/regras",   label: "Regras"   },
];

export default function Header({
  user,
  onOpenProfile,
}: {
  user: User;
  onOpenProfile: () => void;
}) {
  const pathname = usePathname();
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <header
      className="hidden lg:block"
      style={{
        height: 60,
        background: "var(--surface)", borderBottom: "1px solid var(--line)",
        position: "sticky", top: 0, zIndex: 20, flexShrink: 0,
      }}
    >
      <div style={{
        maxWidth: 900, margin: "0 auto", height: "100%",
        display: "flex", alignItems: "center", gap: 16, padding: "0 30px",
      }}>
        {/* wordmark + bolão switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Link href="/home" style={{ textDecoration: "none" }}><Wordmark /></Link>
          <BolaoSwitcher compact />
        </div>

        {/* nav central */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {navItems.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                padding: "7px 14px", borderRadius: 10, textDecoration: "none",
                fontFamily: "Archivo, sans-serif", fontWeight: active ? 800 : 600, fontSize: 14,
                background: active ? "var(--primary)" : "transparent",
                color: active ? "var(--on-primary)" : "var(--ink-2)",
                boxShadow: active ? "0 3px 0 var(--primary-strong)" : "none",
                transition: "all .12s",
              }}>
                {label}
              </Link>
            );
          })}
          {user.isSuperAdmin && (
            <Link href="/adm" style={{
              padding: "7px 14px", borderRadius: 10, textDecoration: "none",
              fontFamily: "Archivo, sans-serif", fontWeight: pathname.startsWith("/adm") ? 800 : 600, fontSize: 14,
              background: pathname.startsWith("/adm") ? "var(--primary)" : "transparent",
              color: pathname.startsWith("/adm") ? "var(--on-primary)" : "var(--primary-strong)",
              transition: "all .12s",
            }}>
              ADM
            </Link>
          )}
        </nav>

        {/* direita: pts + avatar */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <PointsPill pts={user.pts} initials={initials} showAvatar={false} />
          <Avatar size={36} initials={initials} ring onClick={onOpenProfile} />
        </div>
      </div>
    </header>
  );
}
