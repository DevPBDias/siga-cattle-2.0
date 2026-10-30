import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { jsPDF } from "jspdf";
import {
  resolveTenant,
  getTenantPageTitle,
  getTenantCssVariables,
  TENANTS,
} from "./tenant";
import { getTenantBranding, hexToRgb } from "@/lib/branding/get-tenant-branding";
import {
  addReportHeader,
  addReportFooter,
  addReportCoverPage,
} from "@/lib/branding/report-branding";
import { REPORT_COLORS } from "@/lib/pdf/core/base-styles";

describe("Tenant Configuration & Resolution (Multi-tenant Branding)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_TENANT_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_TENANT_ID = originalEnv;
  });

  describe("Cenário A: Fazenda Agro 3mil", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_TENANT_ID = "agro3mil";
    });

    it("deve carregar corretamente a configuração da Fazenda Agro 3mil", () => {
      const res = resolveTenant("agro3mil");
      expect(res.isValid).toBe(true);
      expect(res.tenant).toBeDefined();
      expect(res.tenant?.id).toBe("agro3mil");
      expect(res.tenant?.name).toBe("Fazenda Agro 3mil");
      expect(res.tenant?.logo).toBe("/branding/agro3mil/logo.svg");
      expect(res.tenant?.reportLogo).toBe("/branding/agro3mil/logo-report.png");
      expect(res.tenant?.primaryColor).toBe("#1E3B2B");
      expect(res.tenant?.secondaryColor).toBe("#F7E9D4");
      expect(res.tenant?.backgroundColor).toBe("#F4F7F4");
      expect(res.tenant?.textColor).toBe("#1A241C");
    });

    it("deve gerar o título 'Siga Cattle - Fazenda Agro 3mil'", () => {
      const res = resolveTenant("agro3mil");
      const title = getTenantPageTitle(res);
      expect(title).toBe("Siga Cattle - Fazenda Agro 3mil");
    });

    it("deve resolver o branding de relatórios para Agro 3mil", () => {
      const branding = getTenantBranding("agro3mil");
      expect(branding.farmName).toBe("Fazenda Agro 3mil");
      expect(branding.primaryRgb).toEqual([30, 59, 43]);
      expect(branding.reportLogoUrl).toBe("/branding/agro3mil/logo-report.png");
    });

    it("deve aplicar cores corretas em REPORT_COLORS proxy para Agro 3mil", () => {
      process.env.NEXT_PUBLIC_TENANT_ID = "agro3mil";
      expect(REPORT_COLORS.PRIMARY).toEqual([30, 59, 43]);
    });
  });

  describe("Cenário B: Fazenda B", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_TENANT_ID = "fazendaB";
    });

    it("deve carregar corretamente a configuração da Fazenda B", () => {
      const res = resolveTenant("fazendaB");
      expect(res.isValid).toBe(true);
      expect(res.tenant).toBeDefined();
      expect(res.tenant?.id).toBe("fazendaB");
      expect(res.tenant?.name).toBe("Fazenda B");
      expect(res.tenant?.logo).toBe("/branding/fazenda-b/logo.svg");
      expect(res.tenant?.reportLogo).toBe("/branding/fazenda-b/logo-report.png");
      expect(res.tenant?.primaryColor).toBe("#1162AE");
      expect(res.tenant?.secondaryColor).toBe("#FFCB04");
      expect(res.tenant?.backgroundColor).toBe("#F5F8FC");
      expect(res.tenant?.textColor).toBe("#172337");
    });

    it("deve suportar alias com hífen 'fazenda-b'", () => {
      const res = resolveTenant("fazenda-b");
      expect(res.isValid).toBe(true);
      expect(res.tenant?.id).toBe("fazendaB");
    });

    it("deve gerar o título 'Siga Cattle - Fazenda B'", () => {
      const res = resolveTenant("fazendaB");
      const title = getTenantPageTitle(res);
      expect(title).toBe("Siga Cattle - Fazenda B");
    });

    it("deve resolver o branding de relatórios para Fazenda B sem referências a Agro 3mil", () => {
      const branding = getTenantBranding("fazendaB");
      expect(branding.farmName).toBe("Fazenda B");
      expect(branding.farmName).not.toContain("Agro 3mil");
      expect(branding.primaryRgb).toEqual([17, 98, 174]);
      expect(branding.reportLogoUrl).toBe("/branding/fazenda-b/logo-report.png");
    });

    it("deve aplicar cores corretas em REPORT_COLORS proxy para Fazenda B", () => {
      process.env.NEXT_PUBLIC_TENANT_ID = "fazendaB";
      expect(REPORT_COLORS.PRIMARY).toEqual([17, 98, 174]);
    });
  });

  describe("Cenário Nelore INDI Ouro", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_TENANT_ID = "nelore-indi-ouro";
    });

    it("deve carregar corretamente a configuração de Nelore INDI Ouro com cor azul e logo horizontal PNG", () => {
      const res = resolveTenant("nelore-indi-ouro");
      expect(res.isValid).toBe(true);
      expect(res.tenant).toBeDefined();
      expect(res.tenant?.id).toBe("nelore-indi-ouro");
      expect(res.tenant?.name).toBe("Nelore INDI Ouro");
      expect(res.tenant?.logo).toBe("/branding/nelore-indi-ouro/logo-hor-indiouro.png");
      expect(res.tenant?.reportLogo).toBe("/branding/nelore-indi-ouro/logo-hor-indiouro.png");
      expect(res.tenant?.primaryColor).toBe("#1162ae");
      expect(res.tenant?.backgroundColor).toBe("#0d2a4a");
      expect(res.tenant?.secondaryColor).toBe("#ffcb04");
    });

    it("deve suportar alias 'indi-ouro'", () => {
      const res = resolveTenant("indi-ouro");
      expect(res.isValid).toBe(true);
      expect(res.tenant?.id).toBe("nelore-indi-ouro");
    });

    it("deve gerar o título 'Siga Cattle - Nelore INDI Ouro'", () => {
      const res = resolveTenant("nelore-indi-ouro");
      const title = getTenantPageTitle(res);
      expect(title).toBe("Siga Cattle - Nelore INDI Ouro");
    });
  });

  describe("Cenário C: Identificador inválido ou ausente", () => {
    it("deve reportar erro explícito para identificador inexistente sem assumir outro tenant", () => {
      const res = resolveTenant("fazenda-inexistente-123");
      expect(res.isValid).toBe(false);
      expect(res.tenant).toBeNull();
      expect(res.error).toContain("fazenda-inexistente-123");
      expect(res.error).toContain("não encontrado");
    });

    it("deve reportar erro explícito quando variável de ambiente estiver vazia", () => {
      const res = resolveTenant("");
      expect(res.isValid).toBe(false);
      expect(res.tenant).toBeNull();
      expect(res.error).toContain("NEXT_PUBLIC_TENANT_ID");
    });

    it("não deve gerar título de outra fazenda quando inválido", () => {
      const res = resolveTenant("invalido");
      const title = getTenantPageTitle(res);
      expect(title).toBe("Siga Cattle");
      expect(title).not.toContain("Agro 3mil");
      expect(title).not.toContain("Fazenda B");
    });
  });

  describe("Cenário D: Documentos extensos (múltiplas páginas)", () => {
    it("deve aplicar cabeçalho e rodapé em todas as páginas de um PDF extenso", () => {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm" });

      // Adiciona 5 páginas
      for (let i = 0; i < 4; i++) {
        doc.addPage();
      }
      expect(doc.getNumberOfPages()).toBe(5);

      // Aplica header e footer para Fazenda Agro 3mil
      addReportHeader(doc, {
        reportName: "RELATÓRIO DE ANIMAIS",
        tenantId: "agro3mil",
        totalItems: 125,
      });

      addReportFooter(doc, {
        tenantId: "agro3mil",
      });

      // Validação: doc deve manter as 5 páginas com conteúdo adicionado
      expect(doc.getNumberOfPages()).toBe(5);
    });

    it("deve gerar capa institucional sem erros", () => {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
      addReportCoverPage(doc, {
        reportName: "RELATÓRIO DE DESEMPENHO",
        tenantId: "fazendaB",
        totalItems: 42,
      });
      // Capa adiciona uma página nova para o conteúdo
      expect(doc.getNumberOfPages()).toBe(2);
    });
  });

  describe("Cenário E: Conversão de cores e utilitários", () => {
    it("deve converter hexadecimais para RGB corretamente", () => {
      expect(hexToRgb("#1E3B2B")).toEqual([30, 59, 43]);
      expect(hexToRgb("#1162AE")).toEqual([17, 98, 174]);
      expect(hexToRgb("#FFFFFF")).toEqual([255, 255, 255]);
      expect(hexToRgb("#000")).toEqual([0, 0, 0]);
    });

    it("deve gerar variáveis CSS correspondentes ao tenant", () => {
      const res = resolveTenant("agro3mil");
      const cssVars = getTenantCssVariables(res.tenant);
      expect(cssVars["--color-tenant-primary"]).toBe("#1E3B2B");
      expect(cssVars["--color-tenant-secondary"]).toBe("#F7E9D4");
      expect(cssVars["--color-tenant-background"]).toBe("#F4F7F4");
      expect(cssVars["--color-tenant-text"]).toBe("#1A241C");
    });
  });
});
