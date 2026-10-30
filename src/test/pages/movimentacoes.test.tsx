import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MovimentacoesPage from "@/app/(protected)/movimentacoes/page";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/movimentacoes",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mockar MovementList inteiro para evitar toda a cadeia de hooks internos
// (useMovements → MovementListItem → useUserProfiles → useLocalMutation → @/hooks/core)
vi.mock("@/components/features/commercial/movements/MovementList", () => ({
  MovementList: () => (
    <div>
      <div data-testid="movement-item">
        <span>Venda</span>
        <span>INDI 1001</span>
      </div>
      <a href="/movimentacoes/criar">Nova movimentação</a>
    </div>
  ),
}));

describe("Módulo: Movimentações (movimentacoes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Movimentações'", () => {
    render(<MovimentacoesPage />);
    expect(screen.getByRole("heading", { name: /Movimentações/i })).toBeInTheDocument();
  });

  it("deve exibir a seção de Histórico", () => {
    render(<MovimentacoesPage />);
    expect(screen.getByText("Histórico")).toBeInTheDocument();
  });

  it("deve renderizar os itens de movimentação do mock", () => {
    render(<MovimentacoesPage />);
    expect(screen.getByTestId("movement-item")).toBeInTheDocument();
    expect(screen.getByText("Venda")).toBeInTheDocument();
  });
});
