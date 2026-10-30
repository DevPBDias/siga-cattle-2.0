import {
  getActiveTenant,
  resolveTenant,
  getTenantPageTitle,
  getTenantCssVariables,
  TenantConfig,
  TenantResolution,
} from "@/config/tenant";

export interface TenantBranding {
  tenant: TenantConfig;
  isValid: boolean;
  farmName: string;
  systemName: string;
  pageTitle: string;
  logoUrl: string;
  reportLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  primaryRgb: [number, number, number];
  secondaryRgb: [number, number, number];
  tagline: string;
}

/**
 * Converte cor hexadecimal (#RRGGBB ou #RGB) para tupla [R, G, B].
 */
export function hexToRgb(hex: string, fallback: [number, number, number] = [30, 59, 43]): [number, number, number] {
  if (!hex || typeof hex !== "string") return fallback;
  const clean = hex.replace("#", "").trim();

  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? fallback : [r, g, b];
  }

  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? fallback : [r, g, b];
  }

  return fallback;
}

const DEFAULT_FALLBACK_TENANT: TenantConfig = {
  id: "siga-cattle",
  name: "Fazenda Agro 3mil",
  logo: "/branding/agro3mil/logo.svg",
  reportLogo: "/branding/agro3mil/logo-report.png",
  primaryColor: "#1E3B2B",
  secondaryColor: "#FFCB04",
  backgroundColor: "#F4F7F4",
  textColor: "#1A241C",
  tagline: "Gestão Pecuária Inteligente",
  badgeText: "SIGA Cattle",
};

/**
 * Retorna a identidade visual resolvida do cliente ativo para uso em componentes e relatórios.
 */
export function getTenantBranding(tenantId?: string): TenantBranding {
  const resolution: TenantResolution = tenantId !== undefined ? resolveTenant(tenantId) : getActiveTenant();
  const tenant = resolution.tenant ?? DEFAULT_FALLBACK_TENANT;

  return {
    tenant,
    isValid: resolution.isValid,
    farmName: tenant.name,
    systemName: "SIGA CATTLE",
    pageTitle: getTenantPageTitle(resolution),
    logoUrl: tenant.logo,
    reportLogoUrl: tenant.reportLogo,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    backgroundColor: tenant.backgroundColor,
    textColor: tenant.textColor,
    primaryRgb: hexToRgb(tenant.primaryColor, [30, 59, 43]),
    secondaryRgb: hexToRgb(tenant.secondaryColor, [255, 203, 4]),
    tagline: tenant.tagline ?? "Gestão Pecuária",
  };
}

export {
  getActiveTenant,
  resolveTenant,
  getTenantPageTitle,
  getTenantCssVariables,
};
