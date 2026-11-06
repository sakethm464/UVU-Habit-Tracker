"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Logo } from "@/components/ui/Logo";
import { CalendarIcon, ChartIcon, GearIcon, ListIcon } from "@/components/ui/icons";

// Order is fixed by design.md: Today, Manage Habits, Timeline, Settings.
const MAIN = [
  { href: "/today", label: "Today", Icon: CalendarIcon },
  { href: "/habits", label: "Manage Habits", Icon: ListIcon },
  { href: "/timeline", label: "Timeline", Icon: ChartIcon },
];
const ACCOUNT = [{ href: "/settings", label: "Settings", Icon: GearIcon }];

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: typeof CalendarIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "flex items-center gap-3 rounded-[12px] border px-[14px] py-[10px] text-[14px] no-underline transition-colors " +
        (active
          ? "border-[var(--gold-border)] bg-[var(--gold-soft)] font-semibold text-[var(--gold-text)]"
          : "border-transparent font-medium text-[var(--text-secondary)] hover:text-[var(--text)]")
      }
    >
      <Icon />
      {label}
    </Link>
  );
}

const sectionLabel = "px-[14px] pb-[6px] text-[11px] font-semibold uppercase tracking-[1px] text-[var(--text-muted)]";

export function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-none flex-col gap-7 border-r border-[var(--border-subtle)] bg-[var(--bg)]/60 px-5 py-7">
      <div className="px-[6px]">
        <Logo href="/today" size={40} />
      </div>

      <nav className="flex flex-col gap-1" aria-label="Main">
        <div className={sectionLabel}>Main</div>
        {MAIN.map((n) => (
          <NavLink key={n.href} {...n} active={isActive(n.href)} />
        ))}
        <div className={sectionLabel + " pt-5"}>Account</div>
        {ACCOUNT.map((n) => (
          <NavLink key={n.href} {...n} active={isActive(n.href)} />
        ))}
      </nav>

      <div className="flex-1" />

      <ProfileMenu name={name} email={email} />
    </aside>
  );
}
