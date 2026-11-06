"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  /** Right-aligned label slot (e.g. a "Forgot?" link). */
  labelAction?: React.ReactNode;
};

const inputClass =
  "w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-[14px] text-[15px] text-[var(--text)] " +
  "placeholder:text-[var(--text-muted)] focus:border-[var(--gold-border)] focus:outline-2 focus:outline-offset-0 focus:outline-[var(--gold-soft)]";

export function TextField({ label, error, labelAction, id, type, className = "", ...props }: Props) {
  const auto = useId();
  const inputId = id ?? auto;
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-[12px] font-medium tracking-[0.3px] text-[var(--text-secondary)]">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[8px] p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[12px] text-[var(--habit-coral)]">
          {error}
        </p>
      )}
    </div>
  );
}
