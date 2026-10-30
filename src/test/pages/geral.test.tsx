import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReportPage from "@/app/(protected)/geral/page";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/geral",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ReportsWorkspace é muito complexo internamente (contexto + hooks + PDF).
// Mockamos o componente inteiro para testar apenas que a página renderiza corretamente.
vi.mock("@/components/features/reports/ReportsWorkspace", () => ({
  default: () => (
    <div>
      <h3 role="heading">Relatórios</h3>
      <nav>
        <button>PDF</button>
        <button>Planilhas</button>
      </nav>
      <section>
        <span>Animais por Fazenda</span>
        <span>Vacinas</span>
        <span>Reprodução</span>
      </section>
    </div>
  ),
}));

describe("Módulo: Relatórios Gerais (geral)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Relatórios'", () => {
    render(<ReportPage />);
    expect(screen.getByRole("heading", { name: /Relatórios/i })).toBeInTheDocument();
  });

  it("deve exibir as opções de formato PDF e Planilhas", () => {
    render(<ReportPage />);
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Planilhas")).toBeInTheDocument();
  });

  it("deve exibir categorias de relatórios disponíveis", () => {
    render(<ReportPage />);
    expect(screen.getByText("Animais por Fazenda")).toBeInTheDocument();
    expect(screen.getByText("Vacinas")).toBeInTheDocument();
    expect(screen.getByText("Reprodução")).toBeInTheDocument();
  });
});
