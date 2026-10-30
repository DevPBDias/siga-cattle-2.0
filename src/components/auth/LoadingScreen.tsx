"use client";

import React from "react";
import { getTenantBranding } from "@/lib/branding/get-tenant-branding";

const LoadingScreen = () => {
  const branding = getTenantBranding();
  const initials = branding.farmName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <main
      className="relative p-6 flex flex-col gap-6 items-center justify-center w-full min-h-dvh select-none"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
      }}
    >
      {/* Luz ambiente de fundo */}
      <div
        className="pointer-events-none absolute h-64 w-64 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: branding.primaryColor }}
      />

      {/* Emblema Circular */}
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
        style={{
          backgroundColor: branding.primaryColor,
          border: `2px solid ${branding.secondaryColor}`,
        }}
      >
        <span
          className="text-lg font-black tracking-wider"
          style={{ color: branding.secondaryColor }}
        >
          {initials}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-base font-bold tracking-tight">
          {branding.farmName}
        </h2>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75"
          style={{ color: branding.primaryColor }}
        >
          SIGA CATTLE
        </span>
      </div>

      {/* Loader animado */}
      <div className="relative mt-2 h-1 w-32 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full w-1/2 animate-[shimmer_1.5s_infinite] rounded-full"
          style={{ backgroundColor: branding.secondaryColor }}
        />
      </div>
    </main>
  );
};

export default LoadingScreen;
