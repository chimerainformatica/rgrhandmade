"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SuccessDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoCloseDuration?: number;
};

export function SuccessDialog({
  isOpen,
  title,
  message,
  onClose,
  autoCloseDuration = 5000,
}: SuccessDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(onClose, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, autoCloseDuration]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm overflow-hidden border border-gold/24 bg-[#171411] p-8 shadow-[0_34px_120px_rgba(0,0,0,0.32)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />

              <div className="mb-6 flex items-center justify-center">
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 200 }}
                  className="h-16 w-16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="11" className="stroke-gold" strokeWidth="2" />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    d="M7 12.5l3 3 7-7"
                    className="stroke-gold"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </div>

              <h2 className="mb-3 text-center font-serif text-2xl font-normal text-ivory">
                {title}
              </h2>
              <p className="mb-6 text-center text-sm leading-relaxed text-ivory/62">
                {message}
              </p>

              <button
                onClick={onClose}
                className="w-full rounded-full border border-gold bg-gold px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-warm-black transition-all duration-300 hover:-translate-y-px hover:border-gold-light hover:bg-gold-light"
              >
                Chiudi
              </button>

              <div className="mt-3 h-1 overflow-hidden bg-gold/10">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: autoCloseDuration / 1000, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-gold to-gold-light"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
