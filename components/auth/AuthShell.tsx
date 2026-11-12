import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

type Props = {
  children: React.ReactNode;
  /** e.g. "New here?" + link */
  prompt?: string;
  linkLabel?: string;
  linkHref?: string;
};

/** Shared frame for sign up / sign in / password screens (desktop layout, light + dark). */
export function AuthShell({ children, prompt, linkLabel, linkHref }: Props) {
  return (
    <div className="page-glow flex min-h-dvh flex-col overflow-x-hidden">
      <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-[calc(16px+env(safe-area-inset-top))] md:px-14 md:py-6">
        <Logo href="/welcome" />
        {prompt && linkHref && linkLabel && (
          <div className="text-right text-[13px] text-[var(--text-secondary)] md:text-[14px]">
            {prompt}{" "}
            <Link href={linkHref} className="font-semibold text-[var(--gold-text)] no-underline hover:underline">
              {linkLabel}
            </Link>
          </div>
        )}
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] md:items-center md:px-14 md:pb-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-[440px] rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:rounded-[24px] md:p-9"
      style={{ boxShadow: "var(--shadow-elevated)" }}
    >
      <div className="mb-6 text-center md:mb-8">
        <h1 className="mb-2 text-[24px] font-bold tracking-[-0.6px] md:text-[28px]">{title}</h1>
        {subtitle && <p className="text-[14px] text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-[12px] border border-[var(--habit-coral)]/40 bg-[var(--habit-coral)]/10 px-4 py-3 text-[13px] text-[var(--habit-coral)]"
    >
      {message}
    </p>
  );
}

export function SetupNotice() {
  return (
    <div className="max-w-[440px] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-[14px] text-[var(--text-secondary)]">
      <p className="mb-2 font-semibold text-[var(--text)]">Supabase isn&apos;t configured yet</p>
      Copy <code>.env.example</code> to <code>.env.local</code> and fill in <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart the dev server.
    </div>
  );
}
