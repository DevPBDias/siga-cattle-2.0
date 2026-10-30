import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfilePage from "@/app/(protected)/perfil/page";

const profileMocks = vi.hoisted(() => ({
  saveProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/LogoutBtn", () => ({
  default: () => <button type="button">Sair da conta</button>,
}));

vi.mock("@/hooks/auth/useUserAccess", () => ({
  useUserAccess: () => ({
    role: "owner",
    canAccess: () => true,
  }),
}));

vi.mock("@/hooks/db/user_profiles/useUserProfile", () => ({
  useUserProfile: () => ({
    data: {
      id: "user-1",
      full_name: "João da Silva",
      residential_address: "Rua das Palmeiras, 120",
      cpf: "123.456.789-00",
      phone: "(11) 99876-5432",
      email: "joao@example.com",
      farm_name: "Fazenda Frontel",
      farm_state_registration: "",
      farm_address: "",
      farm_city: "",
      farm_car_number: "",
      farm_sigcar: "",
      farm_nirb: "",
      farm_ccir: "",
    },
    user: { id: "user-1", email: "joao@example.com", user_metadata: {} },
    loading: false,
    error: null,
    actions: { saveProfile: profileMocks.saveProfile },
  }),
}));

vi.mock("@/hooks/db/user_profiles/useUserProfiles", () => ({
  useUserProfiles: () => ({
    data: [],
    loading: false,
    error: null,
    actions: {
      update: profileMocks.updateProfile,
      create: profileMocks.createProfile,
    },
  }),
}));

describe("ProfilePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMocks.saveProfile.mockResolvedValue(undefined);
  });

  it("deve renderizar o cabeçalho corretamente", () => {
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "Meu Perfil" })).toBeInTheDocument();
  });

  it("deve exibir os dados iniciais do usuário e a aba 'Usuário' selecionada", () => {
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "João da Silva" })).toBeInTheDocument();
    expect(screen.getByText("Administrador da fazenda")).toBeInTheDocument();
    expect(screen.getByText("Informações do usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveValue("joao@example.com");
  });

  it("deve alternar para a aba 'Fazenda' ao clicar", async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByRole("tab", { name: /Fazenda/i }));

    expect(await screen.findByText("Dados da fazenda")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome fazenda")).toHaveValue("Fazenda Frontel");
  });

  it("deve habilitar os campos para edição ao clicar em 'Editar informações'", () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText("Editar informações"));

    expect(screen.getByText("Salvar alterações")).toBeInTheDocument();
    const inputNome = screen.getByLabelText("Nome usuário");
    expect(inputNome).toBeInTheDocument();
    expect(inputNome).toHaveValue("João da Silva");
    expect(inputNome).not.toBeDisabled();
  });

  it("deve salvar os dados pessoais no perfil do usuário", async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText("Editar informações"));
    fireEvent.change(screen.getByLabelText("Nome usuário"), {
      target: { value: "Maria da Silva" },
    });
    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() =>
      expect(profileMocks.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: "Maria da Silva",
          email: "joao@example.com",
          farm_name: "Fazenda Frontel",
        }),
      ),
    );
  });

  it("deve navegar de volta ao clicar em voltar", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByLabelText("Voltar"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("no fluxo Novo Usuário, deve exibir formulário de dados pessoais sem select de função ou permissões por tela", async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByRole("tab", { name: /Permissões/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Novo usuário/i }));

    expect(screen.getByText("Criar Novo Usuário")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Carlos Eduardo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: carlos@fazenda.com")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Função \(Cargo\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Permissões de Telas")).not.toBeInTheDocument();
    expect(screen.getByText("Função atribuída:")).toBeInTheDocument();
    expect(screen.getByText("Membro da equipe")).toBeInTheDocument();
    expect(
      screen.getByText(/somente visualização da tela de/i),
    ).toBeInTheDocument();
  });
});

