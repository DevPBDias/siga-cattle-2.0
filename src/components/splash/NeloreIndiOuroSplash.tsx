"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import indiOuroLogo from "@/assets/icons/logo-hor-indiouro.png";
import indiOuroIcon from "@/assets/icons/logo-j.png";

interface NeloreIndiOuroSplashProps {
  onSkip?: () => void;
}

export function NeloreIndiOuroSplash({ onSkip }: NeloreIndiOuroSplashProps) {
  return (
    <motion.main
      key="splash-nelore-indi-ouro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={onSkip}
      className="relative h-dvh w-full overflow-hidden bg-gradient-to-b from-[#081a2f] via-[#1162ae] to-[#061424] flex flex-col items-center justify-center p-6 cursor-pointer select-none"
    >
      {/* Ambient Lighting Background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(17,98,174,0.45)_0%,rgba(255,203,4,0.12)_40%,transparent_70%)]" />

      {/* Central Branding Area */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full -mt-8">
        {/* Circular Gold Emblem with "J" Symbol */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative flex items-center justify-center w-36 h-36 rounded-full bg-[#0d2a4a]/85 border-2 border-[#ffcb04]/60 shadow-[0_0_45px_rgba(255,203,4,0.25)] p-3 backdrop-blur-md"
        >
          {/* Subtle spinning dashed ring */}
          <div className="absolute inset-[-6px] rounded-full border border-dashed border-[#ffcb04]/40 animate-[spin_40s_linear_infinite]" />

          <Image
            src={indiOuroIcon}
            alt="Nelore INDI Ouro Símbolo"
            width={75}
            height={75}
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
            src={indiOuroLogo}
            alt="Nelore INDI Ouro"
            width={260}
            height={85}
            className="h-16 w-auto object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
            priority
          />

          <div className="flex items-center gap-2 mt-1">
            <span className="h-[1px] w-6 bg-[#ffcb04]/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#ffcb04]">
              Nelore PO • Genética
            </span>
            <span className="h-[1px] w-6 bg-[#ffcb04]/40" />
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
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#ffcb04] to-transparent rounded-full"
          />
        </div>

        <span className="text-[11px] font-medium tracking-wider text-white/60">
          Carregando...
        </span>
      </motion.div>
    </motion.main>
  );
}
