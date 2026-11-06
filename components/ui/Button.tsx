import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 font-bold transition-[transform,opacity,box-shadow] duration-150 " +
  "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-gold shadow-[0_10px_28px_-8px_var(--gold-glow)] hover:opacity-95",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-semibold hover:border-[var(--gold-border)]",
  ghost: "text-[var(--text-secondary)] font-medium hover:text-[var(--text)]",
};

const sizes = {
  md: "rounded-[12px] px-[18px] py-[10px] text-[14px]",
  lg: "rounded-[14px] px-6 py-[14px] text-[15px]",
};

type Common = { variant?: Variant; size?: keyof typeof sizes; className?: string };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Common & ComponentProps<typeof Link>) {
  return <Link className={`${base} no-underline ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
