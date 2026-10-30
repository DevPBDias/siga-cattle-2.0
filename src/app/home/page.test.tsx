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

// Mock do hook de replicação
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

vi.mock("@/hooks/sync/useSyncStatus", () => ({
  useReplication: () => ({
    triggerSync: mockTriggerSync,
    initialSyncReady: true,
    isSyncing: false,
    online: true,
  }),
}));

// Força ambiente mobile para evitar redirect desktop
vi.mock("@/hooks/use-mobile", () => ({
  isDesktopDevice: () => false,
  getDeviceHomeRoute: () => "/home",
}));

// Mock do WrapperAuth para renderizar os filhos diretamente
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock hooks de dados
vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({ data: [], loading: false }),
}));

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

describe("HomePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho e título principal corretamente", async () => {
    render(<HomePage />);
    // O logo do SIGA Cattle ou INDI Ouro deve estar presente
    const logo = screen.getByRole("img");
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

  it("deve mostrar notificação rápida ao clicar no sino", async () => {
    render(<HomePage />);
    const bellBtn = screen.getByLabelText("Notificações");
    fireEvent.click(bellBtn);
    await waitFor(() => {
      expect(screen.getByText(/Notificações/i)).toBeInTheDocument();
    });
  });
});
