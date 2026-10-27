"use client";

import { useState } from "react";
import {
  Bell,
} from "lucide-react";

import ProtectedClient from "@/components/auth/WrapperAuth";
import logo_siga_cattle from "@/assets/icons/logo_siga_cattle.png";
import Image from "next/image";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";
import HomeButtons from "@/components/buttons/HomeButtons";
import { homeLinks } from "@/constants/HomeLinks";
import { StatsFooter } from "@/components/home/StatsFooter";
import { MarketQuotesCard } from "@/components/features/home/MarketQuotesCard";
import { MobileFooter } from "@/components/layout/MobileFooter";

const HomePage = () => {
  const [notice, setNotice] = useState("");

  function showNotice(label: string) {
    setNotice(`${label} selecionado`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <ProtectedClient>
      <main className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-background">
        <div className="w-full max-w-[1100px] mx-auto px-[22px] pb-8 overflow-y-auto max-h-full">
          {/* Cabeçalho */}
          <header className="relative z-10 min-h-[78px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src={logo_siga_cattle} alt="IndiOuro" width={120} height={80} />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <button
                className="text-white border border-white bg-transparent rounded-md grid place-items-center p-1.5 cursor-pointer hover:text-field-green transition-colors"
                aria-label="Notificações"
                onClick={() => showNotice("Notificações")}
              >
                <Bell size={16} />
              </button>

              <SyncStatusIndicator />
            </div>
          </header>

          <section
            className="absolute top-0 left-0 w-full h-[100dvh] bg-primary rounded-b-3xl z-0"
          />

          <MarketQuotesCard />

          {/* Resumo dinâmico do Rebanho */}
          <StatsFooter />

          {/* Atalhos Rápidos */}
          <HomeButtons data={homeLinks} />
        </div>
        <MobileFooter />
      </main>
    </ProtectedClient>
  );
};

export default HomePage;
