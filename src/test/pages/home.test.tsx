import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "@/app/home/page";

// Forçar viewport mobile (< 768px) para que a página renderize o conteúdo
// (no desktop a página retorna um div vazio e faz redirect)
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 375,
});

// Mock das rotas do next
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock do WrapperAuth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock do hook de mobile (forçar isDesktopDevice() = false)
vi.mock("@/hooks/use-mobile", () => ({
  isDesktopDevice: () => false,
  getDeviceHomeRoute: () => "/",
}));

// Mock dos sub-componentes pesados para evitar dependências desnecessárias
vi.mock("@/components/sync/SyncStatusIndicator", () => ({
  SyncStatusIndicator: () => <button>Sincronizado</button>,
}));

vi.mock("@/components/home/StatsFooter", () => ({
  StatsFooter: () => (
    <div>
      <span>Total de animais</span>
      <span>785</span>
      <span>Machos</span>
      <span>234</span>
      <span>Fêmeas</span>
      <span>548</span>
    </div>
  ),
}));

vi.mock("@/components/features/home/MarketQuotesCard", () => ({
  MarketQuotesCard: () => (
    <div>
      <span>Preços de mercado</span>
      <span>Boi Gordo</span>
      <span>R$ 280,00</span>
      <span>Vaca Gorda</span>
      <span>R$ 260,00</span>
    </div>
  ),
}));

vi.mock("@/components/buttons/HomeButtons", () => ({
  default: ({ data }: { data: { href: string; name: string }[] }) => (
    <div>
      {data.map((item) => (
        <a key={item.href} href={item.href} onClick={(e) => { e.preventDefault(); mockPush(item.href); }}>
          {item.name}
        </a>
      ))}
    </div>
  ),
}));

vi.mock("@/components/layout/MobileFooter", () => ({
  MobileFooter: () => <nav />,
}));

describe("HomePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o logo da aplicação", async () => {
    render(<HomePage />);
    expect(screen.getByAltText(/SIGA Cattle|IndiOuro/i)).toBeInTheDocument();
  });

  it("deve renderizar as estatísticas do rebanho (via StatsFooter mockado)", () => {
    render(<HomePage />);
    expect(screen.getByText("Total de animais")).toBeInTheDocument();
    expect(screen.getByText("785")).toBeInTheDocument();
    expect(screen.getByText("Machos")).toBeInTheDocument();
    expect(screen.getByText("234")).toBeInTheDocument();
    expect(screen.getByText("Fêmeas")).toBeInTheDocument();
    expect(screen.getByText("548")).toBeInTheDocument();
  });

  it("deve renderizar a seção de cotações do mercado (via MarketQuotesCard mockado)", () => {
    render(<HomePage />);
    expect(screen.getByText("Preços de mercado")).toBeInTheDocument();
    expect(screen.getByText("Boi Gordo")).toBeInTheDocument();
    expect(screen.getByText("R$ 280,00")).toBeInTheDocument();
  });

  it("não deve exibir o atalho de Mortes na Home", () => {
    render(<HomePage />);
    expect(screen.queryByText("Mortes")).not.toBeInTheDocument();
  });

  it("deve navegar para a tela correta ao clicar nos atalhos rápidos", async () => {
    render(<HomePage />);
    const vacinasBtn = screen.getByText("Vacinas");
    fireEvent.click(vacinasBtn);
    expect(mockPush).toHaveBeenCalledWith("/vacinas");

    const nascimentosBtn = screen.getByText("Nascimentos");
    fireEvent.click(nascimentosBtn);
    expect(mockPush).toHaveBeenCalledWith("/nascimentos");

    const movimentacoesBtn = screen.getByText("Movimentações");
    fireEvent.click(movimentacoesBtn);
    expect(mockPush).toHaveBeenCalledWith("/movimentacoes");
  });

  it("deve mostrar notificação rápida ao clicar no sino", async () => {
    render(<HomePage />);
    const bellBtn = screen.getByLabelText("Notificações");
    fireEvent.click(bellBtn);
    await waitFor(() => {
      expect(screen.getByText("Notificações selecionado")).toBeInTheDocument();
    });
  });
});
