import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./page";

// Mock das rotas do next
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock do hook de replicação
const mockTriggerSync = vi.fn();
vi.mock("@/hooks/sync/useSyncStatus", () => ({
  useReplication: () => ({
    triggerSync: mockTriggerSync,
  }),
}));

// Mock do WrapperAuth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("HomePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho e título principal corretamente", async () => {
    render(<HomePage />);
    
    expect(screen.getByAltText("IndiOuro")).toBeInTheDocument();
    expect(screen.getByLabelText("Gado em uma fazenda")).toBeInTheDocument();
  });

  it("deve disparar a sincronização (triggerSync) no mount", () => {
    render(<HomePage />);
    expect(mockTriggerSync).toHaveBeenCalledTimes(1);
  });

  it("deve renderizar as estatísticas do rebanho", () => {
    render(<HomePage />);
    
    expect(screen.getByText("Total de animais")).toBeInTheDocument();
    expect(screen.getByText("785")).toBeInTheDocument();
    expect(screen.getByText("Machos")).toBeInTheDocument();
    expect(screen.getByText("234")).toBeInTheDocument();
    expect(screen.getByText("Fêmeas")).toBeInTheDocument();
    expect(screen.getByText("548")).toBeInTheDocument();
  });

  it("deve renderizar a seção de cotações do mercado", () => {
    render(<HomePage />);
    
    expect(screen.getByText("Preços de mercado")).toBeInTheDocument();
    expect(screen.getByText("Boi Gordo")).toBeInTheDocument();
    expect(screen.getByText("R$ 280,00")).toBeInTheDocument();
    expect(screen.getByText("Vaca Gorda")).toBeInTheDocument();
    expect(screen.getByText("R$ 260,00")).toBeInTheDocument();
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
