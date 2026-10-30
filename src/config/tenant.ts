/**
 * Identidade Visual Centralizada por Fazenda (Multi-tenant) | Siga Cattle
 *
 * Configuração estática tipada por cliente. A seleção do tenant ativo é
 * realizada exclusivamente pela variável de ambiente NEXT_PUBLIC_TENANT_ID.
 */

export type TenantConfig = {
  id: string;
  name: string;
  logo: string;
  reportLogo: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  tagline?: string;
  badgeText?: string;
};

export const TENANTS: Record<string, TenantConfig> = {
  agro3mil: {
    id: "agro3mil",
    name: "Fazenda Agro 3mil",
    logo: "/branding/agro3mil/logo.svg",
    reportLogo: "/branding/agro3mil/logo-report.png",
    primaryColor: "#1E3B2B",
    secondaryColor: "#F7E9D4",
    backgroundColor: "#F4F7F4",
    textColor: "#1A241C",
    tagline: "Gestão Pecuária • Alta Performance",
    badgeText: "Agro 3mil",
  },
  fazendaB: {
    id: "fazendaB",
    name: "Fazenda B",
    logo: "/branding/fazenda-b/logo.svg",
    reportLogo: "/branding/fazenda-b/logo-report.png",
    primaryColor: "#1162AE",
    secondaryColor: "#FFCB04",
    backgroundColor: "#F5F8FC",
    textColor: "#172337",
    tagline: "Rebanho Comercial & Reprodução",
    badgeText: "Fazenda B",
  },
  "fazenda-b": {
    id: "fazendaB",
    name: "Fazenda B",
    logo: "/branding/fazenda-b/logo.svg",
    reportLogo: "/branding/fazenda-b/logo-report.png",
    primaryColor: "#1162AE",
    secondaryColor: "#FFCB04",
    backgroundColor: "#F5F8FC",
    textColor: "#172337",
    tagline: "Rebanho Comercial & Reprodução",
    badgeText: "Fazenda B",
  },
  "nelore-indi-ouro": {
    id: "nelore-indi-ouro",
    name: "Nelore INDI Ouro",
    logo: "/branding/nelore-indi-ouro/logo-hor-indiouro.png",
    reportLogo: "/branding/nelore-indi-ouro/logo-hor-indiouro.png",
    primaryColor: "#1162ae",
    secondaryColor: "#ffcb04",
    backgroundColor: "#0d2a4a",
    textColor: "#ffffff",
    tagline: "Nelore PO • Genética",
    badgeText: "INDI Ouro",
  },
  "indi-ouro": {
    id: "nelore-indi-ouro",
    name: "Nelore INDI Ouro",
    logo: "/branding/nelore-indi-ouro/logo-hor-indiouro.png",
    reportLogo: "/branding/nelore-indi-ouro/logo-hor-indiouro.png",
    primaryColor: "#1162ae",
    secondaryColor: "#ffcb04",
    backgroundColor: "#0d2a4a",
    textColor: "#ffffff",
    tagline: "Nelore PO • Genética",
    badgeText: "INDI Ouro",
  },
  "siga-cattle": {
    id: "siga-cattle",
    name: "SIGA Cattle",
    logo: "/logo.svg",
    reportLogo: "/branding/agro3mil/logo-report.png",
    primaryColor: "#1e3b2b",
    secondaryColor: "#ffcb04",
    backgroundColor: "#f4f7f4",
    textColor: "#1a241c",
    tagline: "Gestão Pecuária Inteligente",
    badgeText: "SIGA Cattle",
  },
};

export interface TenantResolution {
  tenant: TenantConfig | null;
  isValid: boolean;
  error: string | null;
  rawId: string | undefined;
}

/**
 * Resolve o tenant a partir do ID fornecido ou da variável de ambiente NEXT_PUBLIC_TENANT_ID.
 * Não seleciona silenciosamente outro cliente se o ID for inválido ou ausente.
 */
export function resolveTenant(tenantId?: string): TenantResolution {
  const rawId = tenantId !== undefined ? tenantId : process.env.NEXT_PUBLIC_TENANT_ID;

  if (!rawId || rawId.trim() === "") {
    return {
      tenant: null,
      isValid: false,
      error: "Variável de ambiente NEXT_PUBLIC_TENANT_ID não configurada para este deployment.",
      rawId,
    };
  }

  const normalized = rawId.trim();
  const matched = TENANTS[normalized];

  if (!matched) {
    return {
      tenant: null,
      isValid: false,
      error: `Identificador de fazenda '${normalized}' não encontrado no cadastro de clientes.`,
      rawId: normalized,
    };
  }

  return {
    tenant: matched,
    isValid: true,
    error: null,
    rawId: normalized,
  };
}

/**
 * Retorna o tenant ativo atual com base no ambiente.
 */
export function getActiveTenant(): TenantResolution {
  return resolveTenant();
}

/**
 * Retorna o título da aba do navegador no padrão obrigatório:
 * "Siga Cattle - Nome da Fazenda"
 */
export function getTenantPageTitle(resolution?: TenantResolution): string {
  const res = resolution ?? getActiveTenant();
  if (res.tenant) {
    return `Siga Cattle - ${res.tenant.name}`;
  }
  return "Siga Cattle";
}

/**
 * Retorna as variáveis CSS para injetar no documento a partir do tenant.
 */
export function getTenantCssVariables(tenant: TenantConfig | null): Record<string, string> {
  if (!tenant) {
    return {
      "--color-tenant-primary": "#1e3b2b",
      "--color-tenant-secondary": "#f7e9d4",
      "--color-tenant-background": "#f4f7f4",
      "--color-tenant-text": "#1a241c",
    };
  }

  return {
    "--color-tenant-primary": tenant.primaryColor,
    "--color-tenant-secondary": tenant.secondaryColor,
    "--color-tenant-background": tenant.backgroundColor,
    "--color-tenant-text": tenant.textColor,
  };
}
