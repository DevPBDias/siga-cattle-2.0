"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import splashImg from "@/assets/images/splash-agro3mil.png";

interface Agro3milSplashProps {
  onSkip?: () => void;
}

export function Agro3milSplash({ onSkip }: Agro3milSplashProps) {
  return (
    <motion.main
      key="splash-agro3mil"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={onSkip}
      className="relative flex h-dvh w-full cursor-pointer select-none items-center justify-center overflow-hidden bg-[#2B68B1]"
    >
      {/* Container da imagem splash:
          - Mobile (< 768px): ocupa a tela preenchendo o display
          - Desktop (>= 768px): centralizada no centro, mantendo proporção, com o fundo azul #2B68B1 cobrindo o restante
      */}
      <div className="relative flex h-full w-full items-center justify-center">
        <Image
          src={splashImg}
          alt="Fazenda Agro 3mil"
          priority
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover md:object-contain object-center"
        />
      </div>

      {/* Indicador de Carregamento Inferior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute bottom-8 z-20 flex flex-col items-center gap-2.5 w-full max-w-[200px]"
      >
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#ffcb04] to-transparent"
          />
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-white/70">
          Carregando...
        </span>
      </motion.div>
    </motion.main>
  );
}

