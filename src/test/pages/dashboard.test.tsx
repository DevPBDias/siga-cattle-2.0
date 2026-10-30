import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "@/app/(protected)/dashboard/page";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => "/dashboard",
}));

// Mock dos subcomponentes do dashboard
vi.mock("@/components/section-cards", () => ({
  SectionCards: () => <div data-testid="section-cards">KPIs do Rebanho</div>,
}));

vi.mock("@/components/chart-area-interactive", () => ({
  ChartAreaInteractive: () => <div data-testid="chart-area">Gráfico</div>,
}));

vi.mock("@/components/data-table", () => ({
  DataTable: () => <div data-testid="data-table">Tabela</div>,
}));

describe("Módulo: Dashboard Geral Desktop (dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("deve renderizar o título do dashboard no desktop", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard Geral")).toBeInTheDocument();
    expect(
      screen.getByText(/Visão consolidada do rebanho/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("section-cards")).toBeInTheDocument();
  });

  it("deve redirecionar para /home quando estiver em dispositivo móvel", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<DashboardPage />);
    expect(mockReplace).toHaveBeenCalledWith("/home");
  });
});

