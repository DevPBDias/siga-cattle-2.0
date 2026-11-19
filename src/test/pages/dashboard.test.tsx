import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "@/app/(protected)/dashboard/page";

const mockReplace = vi.fn();
const mocks = vi.hoisted(() => ({
  role: "owner" as string,
  profile: null as null | { farm_name: string },
  farms: [
    { id: "farm-a", farm_name: "Fazenda A" },
    { id: "farm-b", farm_name: "Fazenda B" },
  ],
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/hooks/db/farms/useFarms", () => ({
  useFarms: () => ({ data: mocks.farms, loading: false, error: null }),
}));

vi.mock("@/hooks/auth/useUserAccess", () => ({
  useUserAccess: () => ({ role: mocks.role, loading: false }),
}));

vi.mock("@/hooks/db/user_profiles/useUserProfile", () => ({
  useUserProfile: () => ({ data: mocks.profile, loading: false, error: null }),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="Filtrar por fazenda"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

// Mock dos subcomponentes do dashboard
vi.mock("@/components/section-cards", () => ({
  SectionCards: ({ farmId }: { farmId?: string }) => (
    <div data-testid="section-cards" data-farm-id={farmId ?? "all"}>KPIs do Rebanho</div>
  ),
}));

vi.mock("@/components/chart-area-interactive", () => ({
  ChartAreaInteractive: ({ farmId }: { farmId?: string }) => (
    <div data-testid="chart-area" data-farm-id={farmId ?? "all"}>Gráfico</div>
  ),
}));

vi.mock("@/components/data-table", () => ({
  DataTable: ({ farmId }: { farmId?: string }) => (
    <div data-testid="data-table" data-farm-id={farmId ?? "all"}>Tabela</div>
  ),
}));

describe("Módulo: Dashboard Geral Desktop (dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = "owner";
    mocks.profile = null;
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
      screen.getByText(/dados locais sincronizados/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("section-cards")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por fazenda" })).toBeInTheDocument();
    expect(screen.getByTestId("section-cards")).toHaveAttribute("data-farm-id", "all");
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

  it("deve aplicar a fazenda selecionada aos blocos do dashboard", async () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por fazenda" }), {
      target: { value: "farm-b" },
    });

    expect(screen.getByTestId("section-cards")).toHaveAttribute("data-farm-id", "farm-b");
    expect(screen.getByTestId("chart-area")).toHaveAttribute("data-farm-id", "farm-b");
    expect(screen.getByTestId("data-table")).toHaveAttribute("data-farm-id", "farm-b");
  });

  it("deve limitar membros à fazenda vinculada ao perfil", () => {
    mocks.role = "member";
    mocks.profile = { farm_name: " fazenda a " };

    render(<DashboardPage />);

    expect(screen.queryByRole("combobox", { name: "Filtrar por fazenda" })).not.toBeInTheDocument();
    expect(screen.getByTestId("section-cards")).toHaveAttribute("data-farm-id", "farm-a");
    expect(screen.getByTestId("chart-area")).toHaveAttribute("data-farm-id", "farm-a");
    expect(screen.getByTestId("data-table")).toHaveAttribute("data-farm-id", "farm-a");
  });

  it("não deve liberar o consolidado se o membro não tiver uma fazenda mapeada", () => {
    mocks.role = "member";

    render(<DashboardPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(/não foi possível identificar a fazenda/i);
    expect(screen.getByTestId("section-cards")).toHaveAttribute("data-farm-id", "");
    expect(screen.getByTestId("chart-area")).toHaveAttribute("data-farm-id", "");
    expect(screen.getByTestId("data-table")).toHaveAttribute("data-farm-id", "");
  });
});

