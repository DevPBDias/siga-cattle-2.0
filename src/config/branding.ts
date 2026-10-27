/**
 * Dynamic Branding and Theme Configuration
 *
 * Switch the active brand by changing ACTIVE_BRAND_ID or setting
 * NEXT_PUBLIC_APP_BRAND in your .env.local file ("nelore-indi-ouro" | "siga-cattle").
 */

export type BrandId = "nelore-indi-ouro" | "siga-cattle";

export interface BrandConfig {
  id: BrandId;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    ring: string;
    gold: string;
  };
  splash: {
    tagline: string;
    bgGradient: {
      from: string;
      via: string;
      to: string;
    };
  };
}

export const BRANDS: Record<BrandId, BrandConfig> = {
  "nelore-indi-ouro": {
    id: "nelore-indi-ouro",
    name: "Nelore INDI Ouro",
    shortName: "INDI Ouro",
    description: "Nelore PO, Melhoramento Genético e Gestão da Fazenda.",
    themeColor: "#1162ae",
    colors: {
      primary: "#1162ae",
      primaryForeground: "#ffffff",
      background: "#f4f7f4",
      ring: "#1162ae",
      gold: "#ffcb04",
    },
    splash: {
      tagline: "NELORE PO • GENÉTICA",
      bgGradient: {
        from: "#081a2f",
        via: "#1162ae",
        to: "#061424",
      },
    },
  },
  "siga-cattle": {
    id: "siga-cattle",
    name: "SIGA Cattle PO",
    shortName: "SIGA Cattle",
    description: "Gestão Pecuária Inteligente e Melhoramento de Rebanho.",
    themeColor: "#1e3b2b",
    colors: {
      primary: "#1e3b2b",
      primaryForeground: "#ffffff",
      background: "#f4f7f4",
      ring: "#2d7d46",
      gold: "#ffcb04",
    },
    splash: {
      tagline: "GESTÃO PECUÁRIA",
      bgGradient: {
        from: "#0f2217",
        via: "#1e3b2b",
        to: "#0b1710",
      },
    },
  },
};

/**
 * Define qual marca está ativa no momento.
 * Pode ser alterada aqui diretamente ou via variável de ambiente NEXT_PUBLIC_APP_BRAND.
 */
export const ACTIVE_BRAND_ID: BrandId =
  (process.env.NEXT_PUBLIC_APP_BRAND as BrandId) || "siga-cattle";

export function getActiveBrand(): BrandConfig {
  return BRANDS[ACTIVE_BRAND_ID] || BRANDS["nelore-indi-ouro"];
}

export const activeBrand = getActiveBrand();
