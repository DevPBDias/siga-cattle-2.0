import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReproducaoPage from "@/app/(protected)/reproducao/page";
import { mockAnimalList } from "../fixtures/domain-data";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/reproducao",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSetSelectedRgn = vi.fn();
const mockSetIsCreateModalOpen = vi.fn();

vi.mock("@/hooks/forms/useReproductionList", () => ({
  useReproductionList: () => ({
    data: {
      // selectedMatriz fornece: title = selectedMatriz.rgn = "1002"
      selectedMatriz: mockAnimalList[1],
      rgnOptions: [{ label: "1002", value: "1002" }],
      reproductionEvents: [
        {
          event_id: "rep-1",
          animal_rgn: "1002",
          event_type: "IATF", // campo correto na ReproductionEventCard
          d0_date: "2025-10-10",
          protocol_name: "Padrão D10",
          productive_status: "Solteira",
          _deleted: false,
        },
      ],
    },
    loading: {
      matrizesLoading: false,
      eventsLoading: false,
    },
    actions: {
      selectedRgn: "1002",
      setSelectedRgn: mockSetSelectedRgn,
      clearSelection: vi.fn(),
      isCreateModalOpen: false,
      setIsCreateModalOpen: mockSetIsCreateModalOpen,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      handleEditEvent: vi.fn(),
      handleDeleteEvent: vi.fn(),
      eventToEdit: null,
      eventToDelete: null,
      closeEdit: vi.fn(),
      closeDelete: vi.fn(),
    },
  }),
}));

describe("Módulo: Reprodução (reproducao)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Reprodução'", () => {
    render(<ReproducaoPage />);
    expect(screen.getByRole("heading", { name: /Reprodução/i })).toBeInTheDocument();
  });

  it("deve exibir a matriz selecionada com o card 'Matriz Selecionada'", () => {
    render(<ReproducaoPage />);
    // SelectedEntityCard renderiza caption e title (= rgn = "1002")
    expect(screen.getByText("Matriz Selecionada")).toBeInTheDocument();
    expect(screen.getByText("1002")).toBeInTheDocument();
  });

  it("deve exibir os eventos reprodutivos da matriz (event_type = IATF)", () => {
    render(<ReproducaoPage />);
    // ReproductionEventCard renderiza event.event_type
    expect(screen.getByText("IATF")).toBeInTheDocument();
  });

  it("deve exibir o botão para registrar novo evento reprodutivo", () => {
    render(<ReproducaoPage />);
    // ReproductionEventList renderiza "Novo Evento"
    const addBtn = screen.getByRole("button", { name: /Novo Evento/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(mockSetIsCreateModalOpen).toHaveBeenCalledWith(true);
  });
});
