"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

function allZones(current: string): string[] {
  let list: string[] = [];
  try {
    list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    list = [];
  }
  return Array.from(new Set([...list, "UTC", current])).sort();
}

const pretty = (z: string) => z.replace(/_/g, " ");

/** Searchable IANA timezone picker (combobox + listbox). */
export function TimezonePicker({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const zones = useMemo(() => allZones(value), [value]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, "_");
    return q ? zones.filter((z) => z.toLowerCase().includes(q)) : zones;
  }, [zones, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(z: string) {
    setOpen(false);
    setQuery("");
    if (z !== value) onChange(z);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-[280px]">
      <input
        role="combobox"
        aria-label="Timezone"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        value={open ? query : pretty(value)}
        placeholder="Search timezones…"
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-[10px] text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-border)] focus:outline-2 focus:outline-[var(--gold-soft)]"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-20 mt-2 max-h-[260px] w-full overflow-y-auto rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          {matches.length === 0 && <li className="px-3 py-2 text-[13px] text-[var(--text-muted)]">No matching timezone</li>}
          {matches.slice(0, 200).map((z, i) => (
            <li
              key={z}
              role="option"
              aria-selected={z === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep input focus until we've chosen
                choose(z);
              }}
              ref={(el) => {
                if (el && i === active) el.scrollIntoView({ block: "nearest" });
              }}
              className={
                "cursor-pointer rounded-[8px] px-3 py-2 text-[13px] " +
                (i === active ? "bg-[var(--gold-soft)] " : "") +
                (z === value ? "font-bold text-[var(--gold-text)]" : "text-[var(--text)]")
              }
            >
              {pretty(z)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
