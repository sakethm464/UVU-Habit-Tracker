import { DEFAULT_ICON, isIconKey, type IconKey } from "@/lib/icons";

const stroke = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

const GLYPHS: Record<IconKey, React.ReactNode> = {
  water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" {...stroke} />,
  run: (
    <>
      <circle cx="15" cy="4.5" r="2" {...stroke} />
      <path d="M6 20l3-5 4 2 2-6 5 3" {...stroke} />
    </>
  ),
  book: <path d="M3 5a2 2 0 0 1 2-2h5v18H5a2 2 0 0 1-2-2V5zM14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5V3z" {...stroke} />,
  meditate: (
    <>
      <circle cx="12" cy="7" r="3" {...stroke} />
      <path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" {...stroke} />
    </>
  ),
  journal: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" {...stroke} />,
  workout: <path d="M6 10v4M3 11v2M18 10v4M21 11v2M6 12h12" {...stroke} strokeWidth={1.9} />,
  sleep: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" {...stroke} />,
  food: <path d="M12 7c-2-2-6-1-6 4 0 5 3 9 6 9s6-4 6-9c0-5-4-6-6-4zM12 7c0-2 1-3 3-4" {...stroke} />,
  walk: (
    <>
      <circle cx="13" cy="4.5" r="2" {...stroke} />
      <path d="M10 21l2-6-3-3 2-4 4 2 2 3M12 15l3 2v4" {...stroke} />
    </>
  ),
  code: <path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" {...stroke} />,
  music: <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" {...stroke} />,
  heart: <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" {...stroke} />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" {...stroke} />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" {...stroke} />
    </>
  ),
  money: <path d="M12 3v18M16 7.5C15 6.5 13.5 6 12 6c-2 0-3.5 1-3.5 2.5S10 11 12 11.5s3.5 1.3 3.5 3S14 18 12 18c-1.6 0-3-.6-4-1.6" {...stroke} />,
  clean: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" {...stroke} />,
  star: <path d="M12 3l2.5 5.5L20 10l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 3z" {...stroke} />,
};

export function HabitIcon({ name, size = 22 }: { name: string | null | undefined; size?: number }) {
  const key = isIconKey(name) ? name : DEFAULT_ICON;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {GLYPHS[key]}
    </svg>
  );
}
