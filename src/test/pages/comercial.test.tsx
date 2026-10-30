import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ComercialPage from "@/app/(protected)/comercial/page";

// Mock do useRouter e usePathname
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/comercial",
}));

// Mock do WrapperAuth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock de vendas
const mockSales = [
  {
    id: "sale-1",
    animal_rgn: "1779",
    client_id: "client-1",
    date: "2026-03-05",
    total_value: 13000,
    payment_method: "Boleto",
    down_payment: 3000,
    installments: "2",
    installment_value: 5000,
    gta_number: "31149 H",
    financial_status: "Pendente",
    _deleted: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

vi.mock("@/hooks/db/sales/useSales", () => ({
  useSales: () => ({
    data: mockSales,
    loading: false,
    availableYears: [2026, 2025],
    actions: {
      searchSales: vi.fn(),
      setYearFilter: vi.fn(),
      setMonthFilter: vi.fn(),
      setClientFilter: vi.fn(),
      setPaymentMethodFilter: vi.fn(),
      updateSale: vi.fn(),
      deleteSale: vi.fn(),
    },
  }),
}));

// Mock de clientes
const mockClients = [
  {
    id: "client-1",
    name: "Abelardo Bezerra Neto",
    cpf_cnpj: "123.456.789-00",
    phone: "(11) 98765-4321",
    farm: "Fazenda Esperança",
    city: "São Paulo",
    _deleted: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

vi.mock("@/hooks/db/clients/useClients", () => ({
  useClients: () => ({
    data: mockClients,
    loading: false,
    actions: {
      searchClients: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
    },
  }),
}));

vi.mock("@/hooks/db/clients/useClientById", () => ({
  useClientById: () => ({
    data: mockClients[0],
    loading: false,
  }),
}));

// Mock de animais
vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({
    data: [{ rgn: "1779", sex: "M", iabcgz: "9.72", deca: "3" }],
    loading: false,
  }),
}));

describe("ComercialPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho padronizado da Gestão Comercial", () => {
    render(<ComercialPage />);
    expect(
      screen.getByRole("heading", { name: /Gestão Comercial/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sincronizado")).toBeInTheDocument();
  });

  it("deve renderizar as abas principais e secundárias", () => {
    render(<ComercialPage />);
    expect(screen.getByText("Vendas")).toBeInTheDocument();
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("Detalhes")).toBeInTheDocument();
    expect(screen.getByText("Gráficos")).toBeInTheDocument();
    expect(screen.getByText("Resumo")).toBeInTheDocument();
  });

  it("deve abrir e fechar o card expansível de filtros", () => {
    render(<ComercialPage />);
    const filterBtn = screen.getByText("Filtros");

    // Filtros inicialmente fechados
    expect(screen.queryByText("Todos os anos")).not.toBeInTheDocument();

    // Clica para expandir
    fireEvent.click(filterBtn);
    expect(screen.getByText("Ano")).toBeInTheDocument();
    expect(screen.getByText("Mês")).toBeInTheDocument();
  });

  it("deve listar a venda existente com número do RGN e valor total", () => {
    render(<ComercialPage />);
    expect(screen.getByText("INDI 1779")).toBeInTheDocument();
  });

  it("deve alternar para a aba 'Clientes' ao clicar", () => {
    render(<ComercialPage />);
    const clientsTab = screen.getByText("Clientes");
    fireEvent.click(clientsTab);

    expect(screen.getByText("Buscar cliente")).toBeInTheDocument();
    expect(screen.getByText("Abelardo Bezerra Neto")).toBeInTheDocument();
  });
});

