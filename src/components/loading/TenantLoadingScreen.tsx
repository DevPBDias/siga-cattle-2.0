"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getActiveTenant, TenantConfig } from "@/config/tenant";
import logoSigaCattle from "@/assets/icons/logo_siga_cattle.png";
import agro3milLoadingImg from "@/assets/images/agro3mil-loading-cattle.png";

interface TenantLoadingScreenProps {
  tenantConfig?: TenantConfig;
  message?: string;
}

export function TenantLoadingScreen({
  tenantConfig,
  message = "CARREGANDO ...",
}: TenantLoadingScreenProps) {
  const resolution = tenantConfig
    ? { tenant: tenantConfig, isValid: true }
    : getActiveTenant();

  const tenantId = resolution.tenant?.id || "agro3mil";

  if (tenantId === "agro3mil" || tenantId === "nelore-indi-ouro") {
    return <Agro3milLoading message={message} />;
  }

  if (tenantId === "haras-luma") {
    return <HarasLumaLoading message={message} />;
  }

  return <SigaCattleLoading message={message} />;
}

/**
 * 1. Loading Fazenda Agro 3mil (Nelore INDI Ouro)
 * Fundo azul #2B68B1, imagem centralizada proporcionalmente reduzida
 * para acomodar perfeitamente a barra de carregamento e o texto "CARREGANDO ..."
 */
function Agro3milLoading({ message }: { message: string }) {
  return (
    <motion.main
      key="loading-agro3mil"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#2B68B1] select-none"
    >
      <div className="flex-1 w-full flex items-center justify-center">
        {/* Imagem do Nelore com estrelas e logo INDI Ouro reduzida proporcionalmente */}
        <div className="relative w-full max-w-[320px] md:max-w-[600px] aspect-[393/720] max-h-[80vh] flex items-center justify-center">
          <Image
            src={agro3milLoadingImg}
            alt="Nelore INDI Ouro - Agro 3mil"
            fill
            sizes="(max-width: 768px) 320px, 600px"
            priority
            className="object-contain object-center"
          />
        </div>
      </div>

      {/* Barra de carregamento e mensagem no rodapé */}
      <div className="w-full flex flex-col items-center gap-2.5 pb-8">
        <span className="text-[12px] md:text-[13px] font-extrabold tracking-[0.25em] text-white uppercase drop-shadow-sm">
          {message}
        </span>
        <ProgressBar color="#FFCB04" bgColor="rgba(255, 255, 255, 0.25)" />
      </div>
    </motion.main>
  );
}

/**
 * 2. Loading Haras Fazenda Luma
 * Fundo verde floresta #2C4A2E, texto tipográfico com o nome da fazenda e barra de carregamento
 */
function HarasLumaLoading({ message }: { message: string }) {
  return (
    <motion.main
      key="loading-haras-luma"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#2C4A2E] px-6 py-12 select-none"
    >
      <div className="flex-1 w-full flex items-center justify-center">
        {/* Texto do Haras Fazenda Luma em fonte condensada e impactante */}
        <div className="flex flex-col items-center text-center leading-tight">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.18em] text-[#F5F3EE] drop-shadow-md">
            HARAS
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.18em] text-[#F5F3EE] drop-shadow-md mt-1">
            FAZENDA LUMA
          </h2>
        </div>
      </div>

      {/* Barra de carregamento e mensagem no rodapé */}
      <div className="w-full flex flex-col items-center gap-2.5 pb-4">
        <span className="text-[12px] md:text-[13px] font-extrabold tracking-[0.25em] text-[#F5F3EE] uppercase drop-shadow-sm">
          {message}
        </span>
        <ProgressBar color="#C9A84C" bgColor="rgba(255, 255, 255, 0.2)" />
      </div>
    </motion.main>
  );
}

/**
 * 3. Loading SIGA Cattle (Padrão)
 * Fundo verde escuro #1E3B2B, logo estilizada SIGA CATTLE em texto (sem ícone do boi) e barra de carregamento
 */
function SigaCattleLoading({ message }: { message: string }) {
  return (
    <motion.main
      key="loading-siga-cattle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#1E3B2B] px-6 py-12 select-none"
    >
      <div className="flex-1 w-full flex items-center justify-center">
        {/* Logo oficial em texto SIGA CATTLE */}
        <div className="relative w-48 sm:w-56 md:w-64 h-28 flex items-center justify-center">
          <Image
            src={logoSigaCattle}
            alt="SIGA Cattle"
            fill
            sizes="250px"
            priority
            className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>

      {/* Barra de carregamento e mensagem no rodapé */}
      <div className="w-full flex flex-col items-center gap-2.5 pb-4">
        <span className="text-[12px] md:text-[13px] font-extrabold tracking-[0.25em] text-[#F7E9D4] uppercase drop-shadow-sm">
          {message}
        </span>
        <ProgressBar color="#FFCB04" bgColor="rgba(255, 255, 255, 0.2)" />
      </div>
    </motion.main>
  );
}

/**
 * Barra de progresso animada e contínua com efeito shimmer e preenchimento progressivo
 */
function ProgressBar({ color, bgColor }: { color: string; bgColor: string }) {
  return (
    <div
      className="relative h-2 w-64 sm:w-72 md:w-80 overflow-hidden rounded-xs shadow-inner"
      style={{ backgroundColor: bgColor }}
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
        className="absolute top-0 h-full w-1/2 rounded-xs"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        }}
      />
      {/* Preenchimento base dourado constante de 35% a 65% para sensação de progresso real */}
      <motion.div
        initial={{ width: "20%" }}
        animate={{ width: ["20%", "65%", "90%"] }}
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="h-full rounded-xs opacity-70"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default TenantLoadingScreen;
