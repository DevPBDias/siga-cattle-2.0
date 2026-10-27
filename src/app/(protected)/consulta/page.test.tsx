import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ConsultAnimals from "./page";

// Mock do useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/consulta",
}));

// Mock do WrapperAuth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock dos animais para teste (incluindo Nelore e Nelore Mocha)
const mockAnimals = [
  {
    rgn: "580",
    name: "INDI 580",
    serie_rgd: "INDI",
    breed: "Nelore Mocha",
    sex: "F",
    status: "IATF",
    animal_state: "ATIVO",
    classification: "A",
    farm_id: "farm-1",
    _deleted: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    rgn: "103",
    name: "INDI 103",
    serie_rgd: "INDI",
    breed: "Nelore",
    sex: "M",
    status: "CONFIRMADA",
    animal_state: "ATIVO",
    classification: "Elite",
    farm_id: "farm-1",
    _deleted: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({
    data: mockAnimals,
    loading: false,
    error: null,
    actions: { refetch: vi.fn() },
  }),
}));

vi.mock("@/hooks/db/farms/useFarms", () => ({
  useFarms: () => ({
    data: [{ id: "farm-1", farm_name: "Fazenda Frontel" }],
    loading: false,
  }),
}));

vi.mock("@/hooks/auth/useUserAccess", () => ({
  useUserAccess: () => ({
    role: "owner",
    canAccess: () => true,
  }),
}));

// Mock do componente DetailsAnimalLayout para isolar o teste da tela de consulta
vi.mock("@/components/features/animals/details/DetailsAnimalLayout", () => ({
  default: ({
    rgn,
    isEditing,
  }: {
    rgn: string;
    isEditing?: boolean;
  }) => (
    <div data-testid="details-animal-layout">
      Ficha do animal RGN: {rgn} {isEditing ? "(editando)" : "(visualizando)"}
    </div>
  ),
}));

describe("ConsultAnimals Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho padronizado da consulta com status de sincronização", () => {
    render(<ConsultAnimals />);
    expect(
      screen.getByRole("heading", { name: "CONSULTA" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sincronizado")).toBeInTheDocument();
  });

  it("deve renderizar o campo de busca de animal com placeholder", () => {
    render(<ConsultAnimals />);
    expect(screen.getByLabelText(/BUSCAR ANIMAL:/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Digite o RGN, nome ou série..."),
    ).toBeInTheDocument();
  });

  it("não deve renderizar a lista completa de animais antes de digitar a busca", () => {
    render(<ConsultAnimals />);
    expect(screen.getByText("Buscar animal por RGN")).toBeInTheDocument();
    expect(screen.queryByText("INDI 580")).not.toBeInTheDocument();
    expect(screen.queryByText("INDI 103")).not.toBeInTheDocument();
  });

  it("deve filtrar a lista ao digitar no campo de busca (case-insensitive e tolerante a espaços)", () => {
    render(<ConsultAnimals />);
    const searchInput = screen.getByPlaceholderText(
      "Digite o RGN, nome ou série...",
    );

    fireEvent.change(searchInput, { target: { value: "indi 580" } });

    expect(screen.getByText("INDI 580")).toBeInTheDocument();
    expect(screen.queryByText("INDI 103")).not.toBeInTheDocument();
  });

  it("deve exibir mensagem clara e botão de cadastrar quando animal não for encontrado", () => {
    render(<ConsultAnimals />);
    const searchInput = screen.getByPlaceholderText(
      "Digite o RGN, nome ou série...",
    );

    fireEvent.change(searchInput, { target: { value: "99999" } });

    expect(screen.getByText(/Animal não encontrado/i)).toBeInTheDocument();
    expect(screen.getByText("Cadastrar Animal")).toBeInTheDocument();
  });

  it("deve selecionar o animal, fixar card no topo com botão X e Editar, e ocultar lista não relacionada", () => {
    render(<ConsultAnimals />);
    const searchInput = screen.getByPlaceholderText(
      "Digite o RGN, nome ou série...",
    );

    fireEvent.change(searchInput, { target: { value: "580" } });

    const detailsButton = screen.getByRole("button", {
      name: /Ver detalhes de INDI 580/i,
    });
    fireEvent.click(detailsButton);

    // Card fixado no topo
    expect(screen.getByText("Animal Selecionado")).toBeInTheDocument();
    expect(screen.getByTestId("details-animal-layout")).toHaveTextContent("580");
    expect(
      screen.getByRole("button", { name: "Editar informações" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fechar detalhes do animal" }),
    ).toBeInTheDocument();

    // A barra de busca fica oculta enquanto selecionado
    expect(screen.queryByLabelText(/BUSCAR ANIMAL:/i)).not.toBeInTheDocument();

    // Clica no botão X para fechar e voltar para a busca
    fireEvent.click(
      screen.getByRole("button", { name: "Fechar detalhes do animal" }),
    );

    expect(screen.getByLabelText(/BUSCAR ANIMAL:/i)).toBeInTheDocument();
  });

  it("deve exibir asterisco e legenda acessível de Nelore Mocha somente no animal selecionado", () => {
    render(<ConsultAnimals />);
    const searchInput = screen.getByPlaceholderText(
      "Digite o RGN, nome ou série...",
    );

    fireEvent.change(searchInput, { target: { value: "580" } });

    const detailsButton = screen.getByRole("button", {
      name: /Ver detalhes de INDI 580/i,
    });
    fireEvent.click(detailsButton);

    // Deve exibir asterisco no topo e legenda acessível
    expect(screen.getByTitle("* Nelore Mocha")).toBeInTheDocument();
    expect(screen.getByText("* Nelore Mocha")).toBeInTheDocument();
  });

  it("não deve exibir asterisco para raça Nelore padrão no animal selecionado", () => {
    render(<ConsultAnimals />);
    const searchInput = screen.getByPlaceholderText(
      "Digite o RGN, nome ou série...",
    );

    fireEvent.change(searchInput, { target: { value: "103" } });

    const detailsButton = screen.getByRole("button", {
      name: /Ver detalhes de INDI 103/i,
    });
    fireEvent.click(detailsButton);

    expect(screen.getByText("Animal Selecionado")).toBeInTheDocument();
    expect(screen.queryByTitle("* Nelore Mocha")).not.toBeInTheDocument();
    expect(screen.queryByText("* Nelore Mocha")).not.toBeInTheDocument();
  });
});
