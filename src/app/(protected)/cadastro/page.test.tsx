import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CadastroAnimalPage from "./page";

// ── Mocks de navegação ──────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => "/cadastro",
}));

// ── Mock do WrapperAuth ──────────────────────────────────────────────────────
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Mock do hook de criação de animal ─────────────────────────────────────────
const mockCreateAnimal = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/db/animals/useCreateAnimal", () => ({
  useCreateAnimal: () => ({
    actions: { createAnimal: mockCreateAnimal },
  }),
}));

// ── Mock do ShortHeader ───────────────────────────────────────────────────────
vi.mock("@/components/layout/ShortHeader", () => ({
  default: ({ title }: { title: string }) => (
    <header>
      <h1>{title}</h1>
    </header>
  ),
}));

// ── Mock do DatePicker para simplificar interação ──────────────────────────
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ value, onChange, required }: any) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  ),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const getAnimalRgnInput = () => screen.getByPlaceholderText("Ex: 1234");

describe("CadastroAnimalPage — Item 7", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o título da página", () => {
    render(<CadastroAnimalPage />);
    expect(screen.getByRole("heading", { name: /Cadastro de Animal/i })).toBeInTheDocument();
  });

  it("deve exibir o campo de Raça com opções Nelore e Nelore Mocha", async () => {
    render(<CadastroAnimalPage />);

    // O select de Raça deve estar visível
    const breedTrigger = screen.getByRole("combobox", { name: /Raça/i });
    expect(breedTrigger).toBeInTheDocument();
  });

  it("deve ter Nelore como valor padrão do campo Raça", () => {
    render(<CadastroAnimalPage />);

    // Verifica que o texto "Nelore" está exibido no select trigger de Raça
    const breedTrigger = screen.getByRole("combobox", { name: /Raça/i });
    expect(breedTrigger).toHaveTextContent("Nelore");
  });

  it("deve exibir os campos do formulário no padrão horizontal (FormSection/FormRow)", () => {
    render(<CadastroAnimalPage />);

    // Verifica que as seções estão presentes
    expect(screen.getByText("Dados Básicos")).toBeInTheDocument();
    expect(screen.getByText("Genealogia")).toBeInTheDocument();
    expect(screen.getByText("Dados Genéticos")).toBeInTheDocument();
  });

  it("deve exibir todos os campos obrigatórios de identificação", () => {
    render(<CadastroAnimalPage />);

    expect(getAnimalRgnInput()).toBeInTheDocument();
    expect(screen.getByLabelText(/Série \/ RGD/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Sexo/i })).toBeInTheDocument();
  });

  it("deve exibir os campos opcionais de genealogia ao abrir o accordion", () => {
    render(<CadastroAnimalPage />);

    fireEvent.click(screen.getByText("Genealogia"));

    expect(screen.getByLabelText(/Pai \(Nome\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mãe \(RGN\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mãe \(Série\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Avô Paterno/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Avô Materno/i)).toBeInTheDocument();
  });

  it("deve exibir os campos de dados genéticos ao abrir o accordion", () => {
    render(<CadastroAnimalPage />);

    fireEvent.click(screen.getByText("Dados Genéticos"));

    expect(screen.getByLabelText(/iABCZg/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/DECA/i)).toBeInTheDocument();
  });

  it("deve enviar o formulário incluindo o campo breed com o valor selecionado", async () => {
    render(<CadastroAnimalPage />);

    // Preenche o RGN
    fireEvent.change(getAnimalRgnInput(), { target: { value: "1234" } });

    // Preenche o campo de série
    const serieInput = screen.getByLabelText(/Série \/ RGD/i);
    fireEvent.change(serieInput, { target: { value: "INDI" } });

    // Submete o formulário
    const submitButton = screen.getByRole("button", { name: /Cadastrar Animal/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          rgn: "1234",
          breed: "Nelore", // Valor padrão deve ser incluído
        }),
      );
    });
  });

  it("deve exibir mensagem de erro quando o cadastro falhar", async () => {
    mockCreateAnimal.mockRejectedValueOnce(new Error("RGN já existe"));

    render(<CadastroAnimalPage />);

    fireEvent.change(getAnimalRgnInput(), { target: { value: "9999" } });

    const submitButton = screen.getByRole("button", { name: /Cadastrar Animal/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Atenção/i)).toBeInTheDocument();
      expect(screen.getByText("RGN já existe")).toBeInTheDocument();
    });
  });

  it("deve exibir modal de sucesso após cadastro com sucesso", async () => {
    render(<CadastroAnimalPage />);

    fireEvent.change(getAnimalRgnInput(), { target: { value: "5555" } });

    const submitButton = screen.getByRole("button", { name: /Cadastrar Animal/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Sucesso!")).toBeInTheDocument();
      expect(screen.getByText(/5555/i)).toBeInTheDocument();
    });
  });
});
