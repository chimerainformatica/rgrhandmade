"use client";

import { motion } from "framer-motion";

/* Numero fittizio segnaposto — sostituire con quello reale del cliente */
const WHATSAPP_NUMBER = "393331234567"; // +39 333 123 4567
const WHATSAPP_MESSAGE = "Ciao! Vorrei avere informazioni sui vostri gioielli handmade.";

export function WhatsAppFab({ label = "Scrivici su WhatsApp" }: { label?: string }) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full
        bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)]
        max-[640px]:bottom-4 max-[640px]:right-4 max-[640px]:h-12 max-[640px]:w-12"
    >
      {/* Anello pulsante */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />

      {/* Logo WhatsApp */}
      <svg
        viewBox="0 0 32 32"
        className="relative h-7 w-7 max-[640px]:h-6 max-[640px]:w-6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.13 6.744 3.05 9.376L1.05 31.34l6.18-1.976A15.92 15.92 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.31 22.594c-.386 1.09-1.918 1.994-3.14 2.258-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826s1.17-3.426 1.642-3.894c.388-.388.846-.564 1.382-.564.174 0 .33.008.47.014.41.018.616.042.886.688.336.81 1.156 2.806 1.254 3.012.1.206.166.448.028.758-.13.32-.244.46-.45.708-.206.248-.402.438-.608.704-.188.232-.4.482-.166.882.234.39 1.04 1.714 2.232 2.776 1.538 1.37 2.812 1.794 3.252 1.978.328.136.718.104.958-.158.304-.336.68-.892 1.062-1.44.272-.392.616-.44.978-.304.368.13 2.354 1.11 2.758 1.312.404.202.672.3.772.47.098.17.098.978-.288 2.068Z" />
      </svg>
    </motion.a>
  );
}
