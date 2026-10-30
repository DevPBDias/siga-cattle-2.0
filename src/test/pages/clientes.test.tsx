import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ClientesPage from "@/app/(protected)/gerenciar/clientes/page";
import { mockClientList } from "../fixtures/domain-data";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/gerenciar/clientes",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/forms/useClientWorkspace", () => ({
  useClientWorkspace: () => ({
    data: {
      headerTitle: "Clientes",
      client: null,
      isEditing: false,
    },
    loading: {
      isClientLoading: false,
      isMutationLoading: false,
    },
    actions: {
      selectedClientId: null,
      setSelectedClientId: vi.fn(),
      isEditing: false,
      setIsEditing: vi.fn(),
      handleClientUpdate: vi.fn(),
      handleClientDelete: vi.fn(),
      handleBack: vi.fn(),
    },
  }),
}));

vi.mock("@/hooks/db/clients/useClients", () => ({
  useClients: () => ({
    data: mockClientList,
    loading: false,
    actions: {
      searchClients: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
    },
  }),
}));

describe("Módulo: Gestão de Clientes (gerenciar/clientes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Clientes'", () => {
    render(<ClientesPage />);
    expect(screen.getByRole("heading", { name: /Clientes/i })).toBeInTheDocument();
  });

  it("deve listar os clientes cadastrados", () => {
    render(<ClientesPage />);
    expect(screen.getByText("Abelardo Bezerra Neto")).toBeInTheDocument();
  });
});

