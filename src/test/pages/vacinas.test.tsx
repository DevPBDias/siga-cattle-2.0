import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VaccinesPage from "@/app/(protected)/vacinas/page";
import { mockVaccinesList } from "../fixtures/domain-data";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/vacinas",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hook de mobile
vi.mock("@/hooks/use-mobile", () => ({
  isDesktopDevice: () => false,
  getDeviceHomeRoute: () => "/",
}));

const mockOpenReview = vi.fn();
const mockToggleVaccine = vi.fn();

vi.mock("@/hooks/forms/useVaccineForm", () => ({
  useVaccineForm: () => ({
    vaccines: mockVaccinesList,
    isLoading: false,
    rgnOptions: [{ label: "1001", value: "1001" }],
    existingVaccinesWithNames: [],
    duplicateWarnings: [],
    loadingAnimalVaccines: false,
    formData: {
      rgn: "1001",
      vacinas: ["vac-1"],
      date: "2026-03-01",
    },
    setFormData: vi.fn(),
    multipleAnimals: false,
    setMultipleAnimals: vi.fn(),
    error: null,
    isSubmitting: false,
    successModalOpen: false,
    addModalOpen: false,
    deleteModalOpen: false,
    reviewModalOpen: false,
    setAddModalOpen: vi.fn(),
    setDeleteModalOpen: vi.fn(),
    setReviewModalOpen: vi.fn(),
    handleOpenReview: mockOpenReview,
    handleConfirmRegister: vi.fn(),
    handleCloseSuccess: vi.fn(),
    handleCreateVaccine: vi.fn(),
    handleDeleteVaccine: vi.fn(),
    toggleVaccine: mockToggleVaccine,
    router: { push: vi.fn() },
  }),
}));

// Mock de componentes que dependem de RxDB / APIs externas
vi.mock("@/components/features/animals/RgnAutocomplete", () => ({
  RgnAutocomplete: ({ value }: { value: string }) => (
    <input aria-label="RGN" defaultValue={value} />
  ),
}));

vi.mock("@/components/features/vaccines/details/AnimalVaccineHistory", () => ({
  AnimalVaccineHistory: () => <div />,
}));

vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ label }: { label: string }) => <label>{label}</label>,
}));

describe("Módulo: Vacinação (vacinas)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Vacinação'", () => {
    render(<VaccinesPage />);
    expect(screen.getByRole("heading", { name: /Vacinação/i })).toBeInTheDocument();
  });

  it("deve exibir as vacinas cadastradas para seleção", () => {
    render(<VaccinesPage />);
    // "Aftosa" vem do mockVaccinesList passado para VaccineSelectionCard
    expect(screen.getByText("Aftosa")).toBeInTheDocument();
  });

  it("deve exibir a seção de identificação do animal vacinado", () => {
    render(<VaccinesPage />);
    // O label real em AnimalIdentificationCard é "Animal vacinado (RGN): *"
    expect(screen.getByText(/Animal vacinado \(RGN\)/i)).toBeInTheDocument();
  });

  it("deve exibir o botão 'Adicionar vacina ao catálogo'", () => {
    render(<VaccinesPage />);
    expect(screen.getByLabelText("Adicionar vacina ao catálogo")).toBeInTheDocument();
  });
});
