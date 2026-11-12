"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT, MAIN, isNavActive } from "@/components/layout/Sidebar";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Logo } from "@/components/ui/Logo";

const TABS = [...MAIN, ...ACCOUNT];

/** Phone-width navigation (< md): top bar with logo + profile, fixed bottom tab bar. The desktop Sidebar is hidden there. */
export function MobileNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg)]/85 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-md md:hidden">
        <Logo href="/today" size={32} />
        <ProfileMenu name={name} email={email} compact />
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-[520px] grid-cols-4">
          {TABS.map(({ href, short, Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex flex-col items-center gap-1 px-1 pb-2 pt-[10px] text-[11px] no-underline transition-colors " +
                    (active ? "font-semibold text-[var(--gold-text)]" : "font-medium text-[var(--text-muted)]")
                  }
                >
                  <span
                    className={
                      "inline-flex h-8 w-12 items-center justify-center rounded-full transition-colors " +
                      (active ? "bg-[var(--gold-soft)]" : "")
                    }
                  >
                    <Icon />
                  </span>
                  {short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
