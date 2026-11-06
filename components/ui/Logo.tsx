import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(135deg, var(--gold-from) 0%, var(--gold-to) 100%)",
        boxShadow: "0 6px 18px -4px var(--gold-glow)",
        color: "var(--on-gold)",
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 5v9a7 7 0 0 0 14 0V5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", size = 36 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3 no-underline" aria-label="UVU home">
      <LogoMark size={size} />
      <span className="text-gold text-[22px] font-extrabold tracking-[-0.5px]">UVU</span>
    </Link>
  );
}
