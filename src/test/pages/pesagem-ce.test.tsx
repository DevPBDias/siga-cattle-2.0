import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PesagemPage from "@/app/(protected)/pesagem-ce/page";
import { mockAnimalList } from "../fixtures/domain-data";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/pesagem-ce",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock do hook principal (evita chain de hooks de RxDB)
vi.mock("@/hooks/forms/usePesagemCe", () => ({
  usePesagemCe: () => ({
    data: {
      selectedAnimal: null,
      rgnOptions: [
        { label: "1001", value: "1001" },
        { label: "1002", value: "1002" },
      ],
      pesosMedidos: [],
      circunferenciaEscrotal: [],
      successModal: { open: false, title: "" },
    },
    loading: false,
    error: null,
    actions: {
      rgn: "",
      setRgn: vi.fn(),
      type: "pesagem",
      setType: vi.fn(),
      isBorn: false,
      setIsBorn: vi.fn(),
      clearSelection: vi.fn(),
      handleAddPeso: vi.fn(),
      handleEditPeso: vi.fn(),
      handleDeletePeso: vi.fn(),
      handleAddCE: vi.fn(),
      handleEditCE: vi.fn(),
      handleDeleteCE: vi.fn(),
      closeSuccess: vi.fn(),
    },
  }),
}));

// Mock do AnimalManageSelector para controlar o que é renderizado
vi.mock("@/components/features/animals/manage/AnimalManageSelector", () => ({
  AnimalManageSelector: ({
    selectedAnimal,
    rgnOptions,
  }: {
    selectedAnimal: (typeof mockAnimalList)[0] | null;
    rgnOptions: { label: string; value: string }[];
  }) => (
    <div>
      {!selectedAnimal && (
        <select aria-label="Buscar Animal (RGN):">
          <option value="">Selecione o animal</option>
          {rgnOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {selectedAnimal && <span>Animal: {selectedAnimal.rgn}</span>}
    </div>
  ),
}));

describe("Módulo: Pesagem e Circunferência Escrotal (pesagem-ce)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Pesagem / CE'", () => {
    render(<PesagemPage />);
    expect(screen.getByRole("heading", { name: /Pesagem \/ CE/i })).toBeInTheDocument();
  });

  it("deve exibir o seletor de animal quando nenhum está selecionado", () => {
    render(<PesagemPage />);
    // O mock renderiza um <select> com "Selecione o animal" quando selectedAnimal = null
    expect(screen.getByText(/Selecione o animal/i)).toBeInTheDocument();
  });

  it("deve listar os animais disponíveis nas opções de seleção", () => {
    render(<PesagemPage />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1001" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1002" })).toBeInTheDocument();
  });
});
