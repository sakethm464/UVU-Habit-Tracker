"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = { open: boolean; onClose: () => void; title: string; children: React.ReactNode };

export function Modal({ open, onClose, title, children }: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative max-h-[92dvh] w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-[var(--border)] bg-[var(--surface)] px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] md:max-h-[90vh] md:rounded-[24px] md:border-b md:p-8"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            {/* Grab handle: signals the bottom sheet on phones. */}
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)] md:hidden" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
