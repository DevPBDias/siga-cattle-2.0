"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import sigaLogo from "@/assets/icons/logo_siga_cattle.png";
import sigaIcon from "@/assets/icons/SIGA CATTLE ICON.png";

interface SigaCattleSplashProps {
  onSkip?: () => void;
}

export function SigaCattleSplash({ onSkip }: SigaCattleSplashProps) {
  return (
    <motion.main
      key="splash-siga-cattle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={onSkip}
      className="relative flex h-dvh w-full cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-primary p-6"
    >
      {/* Ambient Lighting Background */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-field-green/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />

      {/* Central Branding Area */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full -mt-8">
        {/* Circular Cow Emblem */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-brand-gold/50 bg-primary/85 p-3 shadow-[0_0_40px_rgba(255,203,4,0.18)] backdrop-blur-md"
        >
          {/* Subtle spinning dashed ring */}
          <div className="absolute inset-[-6px] animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-field-green/45" />

          <Image
            src={sigaIcon}
            alt="SIGA Cattle Emblem"
            width={120}
            height={120}
            className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
            priority
          />
        </motion.div>

        {/* Typography Logo & Slogan */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <Image
            src={sigaLogo}
            alt="SIGA Cattle PO"
            width={260}
            height={85}
            className="h-16 w-auto object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
            priority
          />

          <div className="flex items-center gap-2 mt-1">
            <span className="h-px w-6 bg-brand-gold/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-gold">
              Gestão Pecuária
            </span>
            <span className="h-px w-6 bg-brand-gold/40" />
          </div>
        </motion.div>
      </div>

      {/* Bottom Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute bottom-10 flex flex-col items-center gap-3 w-full max-w-[220px]"
      >
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-brand-gold to-transparent"
          />
        </div>

        <span className="text-[11px] font-medium tracking-wider text-white/60">
          Carregando...
        </span>
      </motion.div>
    </motion.main>
  );
}
