import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./page";

// Mock das rotas do next (inclui replace para o redirect desktop)
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/home",
}));

// Mock do next/image para evitar erro de width obrigatório em assets locais
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

// Força ambiente mobile para evitar redirect desktop
vi.mock("@/hooks/use-mobile", () => ({
  isDesktopDevice: () => false,
  getDeviceHomeRoute: () => "/home",
}));

// Mock do WrapperAuth para renderizar os filhos diretamente
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock do HomeButtons — evita dependências de next/image + useUserAccess + canAccessPath
vi.mock("@/components/buttons/HomeButtons", () => ({
  default: ({ data }: { data: Array<{ href: string; name: string }> }) => (
    <section data-testid="home-buttons">
      {data.map((item) => (
        <a key={item.href} href={item.href}>
          {item.name}
        </a>
      ))}
    </section>
  ),
}));

// Mock do MobileFooter
vi.mock("@/components/layout/MobileFooter", () => ({
  MobileFooter: () => <nav data-testid="mobile-footer" />,
}));

// Mock hooks de dados
vi.mock("@/hooks/auth/useUserAccess", () => ({
  useUserAccess: () => ({
    user: { id: "user-1" },
    role: "owner",
    loading: false,
    canAccess: () => true,
    canAccessPath: () => true,
  }),
}));

vi.mock("@/components/features/home/MarketQuotesCard", () => ({
  MarketQuotesCard: () => <div>Preços de mercado</div>,
}));

vi.mock("@/components/home/StatsFooter", () => ({
  StatsFooter: () => <div>Total de animais</div>,
}));

vi.mock("@/components/sync/SyncStatusIndicator", () => ({
  SyncStatusIndicator: () => null,
}));

// Mock do hook de replicação (usado pelo ReplicationProvider)
const mockTriggerSync = vi.fn();
vi.mock("@/providers/ReplicationProvider", () => ({
  useReplication: () => ({
    triggerSync: mockTriggerSync,
    initialSyncReady: true,
    isSyncing: false,
    online: true,
    lastSyncedAt: null,
    replicationErrors: [],
    entityStatus: {},
    syncStats: { pending: 0, syncing: 0, error: 0, total: 0 },
    exportSyncLogs: () => "[]",
    getRecentSyncErrors: () => [],
  }),
}));

describe("HomePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simula viewport mobile (< 768px)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 390,
    });
  });

  it("deve renderizar o logo SIGA Cattle", () => {
    render(<HomePage />);
    const logo = screen.getByRole("img", { name: /SIGA Cattle/i });
    expect(logo).toBeInTheDocument();
  });

  it("deve renderizar a seção de cotações do mercado", () => {
    render(<HomePage />);
    expect(screen.getByText("Preços de mercado")).toBeInTheDocument();
  });

  it("deve renderizar as estatísticas do rebanho", () => {
    render(<HomePage />);
    expect(screen.getByText("Total de animais")).toBeInTheDocument();
  });

  it("não deve exibir o atalho de Mortes na Home", () => {
    render(<HomePage />);
    expect(screen.queryByText("Mortes")).not.toBeInTheDocument();
  });

  it("deve ter o botão de notificações clicável", () => {
    render(<HomePage />);
    const bellBtn = screen.getByLabelText("Notificações");
    expect(bellBtn).toBeInTheDocument();
    // O clique não deve lançar erro
    expect(() => fireEvent.click(bellBtn)).not.toThrow();
  });
});
