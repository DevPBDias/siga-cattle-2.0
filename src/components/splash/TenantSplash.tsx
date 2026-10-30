"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getActiveTenant, TenantConfig, TenantResolution, TENANTS } from "@/config/tenant";
import { NeloreIndiOuroSplash } from "./NeloreIndiOuroSplash";

interface TenantSplashProps {
  onSkip?: () => void;
  tenantConfig?: TenantConfig;
  resolution?: TenantResolution;
}

export function TenantSplash({ onSkip, tenantConfig, resolution }: TenantSplashProps) {
  const currentResolution = resolution ?? (tenantConfig ? { tenant: tenantConfig, isValid: true, error: null, rawId: tenantConfig.id } : getActiveTenant());
  const tenant = currentResolution.tenant;
  const [imgError, setImgError] = useState(false);

  // Tratamento explícito para identificador inválido ou ausente (Teste C)
  if (!currentResolution.isValid || !tenant) {
    const registeredIds = Object.keys(TENANTS).filter(k => TENANTS[k].id === k || !Object.keys(TENANTS).some(other => other !== k && TENANTS[other].id === TENANTS[k].id && other.length < k.length));

    return (
      <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#1a241c] p-6 text-white select-none">
        <div className="relative z-10 flex max-w-md w-full flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-wide">
              Configuração de Identidade Visual
            </h2>
            <p className="text-sm text-gray-300">
              {currentResolution.error ?? "Identificador de tenant não configurado."}
            </p>
          </div>

          <div className="w-full rounded-lg bg-black/40 p-4 text-left font-mono text-xs text-gray-400 border border-white/5">
            <div className="text-gray-500 mb-1">// Variável esperada no .env / Vercel:</div>
            <div className="text-emerald-400 font-semibold">
              NEXT_PUBLIC_TENANT_ID=&quot;{currentResolution.rawId || "nome-da-fazenda"}&quot;
            </div>
            <div className="mt-3 text-gray-500 mb-1">// Clientes cadastrados:</div>
            <div className="text-amber-300">
              {registeredIds.join(" | ")}
            </div>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-2 w-full rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
            >
              Continuar com Identidade Padrão &rarr;
            </button>
          )}
        </div>
      </main>
    );
  }

  // Se for agro3mil ou nelore-indi-ouro, renderiza a splash visual especializada Nelore INDI Ouro
  if (tenant.id === "agro3mil" || tenant.id === "nelore-indi-ouro") {
    return <NeloreIndiOuroSplash onSkip={onSkip} />;
  }

  // Obter as iniciais da fazenda para fallback se a imagem falhar
  const initials = tenant.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isNelore = tenant.id === "nelore-indi-ouro";

  return (
    <motion.main
      key={`splash-${tenant.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={onSkip}
      className="relative flex h-dvh w-full cursor-pointer select-none flex-col items-center justify-center overflow-hidden p-6"
      style={{
        background: isNelore
          ? "linear-gradient(180deg, #081a2f 0%, #1162ae 50%, #061424 100%)"
          : tenant.backgroundColor,
      }}
    >
      {/* Luz ambiente de fundo personalizada com as cores da fazenda */}
      <div
        className="pointer-events-none absolute -left-28 top-1/4 h-80 w-80 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: tenant.primaryColor }}
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-1/4 h-80 w-80 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: tenant.secondaryColor }}
      />

      {/* Área Central de Destaque */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full -mt-8">
        {/* Emblema Circular */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative flex h-36 w-36 items-center justify-center rounded-full p-4 shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: isNelore ? "#0d2a4a" : tenant.primaryColor,
            border: `2.5px solid ${tenant.secondaryColor}`,
            boxShadow: `0 0 35px ${tenant.secondaryColor}33`,
          }}
        >
          {/* Anel giratório sutil */}
          <div
            className="absolute inset-[-6px] animate-[spin_40s_linear_infinite] rounded-full border border-dashed opacity-50"
            style={{ borderColor: tenant.secondaryColor }}
          />

          {!imgError ? (
            <div className="relative h-24 w-24 flex items-center justify-center">
              <Image
                src={isNelore ? "/branding/nelore-indi-ouro/logo-icon.png" : tenant.logo}
                alt={tenant.name}
                width={120}
                height={120}
                unoptimized
                className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                priority
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <span
              className="text-2xl font-black tracking-wider"
              style={{ color: tenant.secondaryColor }}
            >
              {initials}
            </span>
          )}
        </motion.div>

        {/* Tipografia: Nome da Fazenda ou Logo Horizontal e Slogan */}
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
          {isNelore ? (
            <div className="relative h-14 md:h-16 w-64 flex items-center justify-center">
              <Image
                src={tenant.logo}
                alt={tenant.name}
                width={260}
                height={85}
                unoptimized
                className="h-full w-auto object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
                priority
              />
            </div>
          ) : (
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: tenant.textColor }}
            >
              {tenant.name}
            </h1>
          )}

          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="h-px w-6"
              style={{ backgroundColor: tenant.secondaryColor }}
            />
            <span
              className="text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{ color: isNelore ? tenant.secondaryColor : tenant.primaryColor }}
            >
              {tenant.tagline ?? "SIGA CATTLE • GESTÃO PECUÁRIA"}
            </span>
            <span
              className="h-px w-6"
              style={{ backgroundColor: tenant.secondaryColor }}
            />
          </div>
        </motion.div>
      </div>

      {/* Indicador de Carregamento Inferior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute bottom-10 flex flex-col items-center gap-3 w-full max-w-[220px]"
      >
        <div
          className="relative h-1 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: `${tenant.textColor}1a` }}
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${tenant.secondaryColor}, transparent)`,
            }}
          />
        </div>

        <span
          className="text-[11px] font-medium tracking-wider opacity-60"
          style={{ color: tenant.textColor }}
        >
          Carregando...
        </span>
      </motion.div>
    </motion.main>
  );
}
