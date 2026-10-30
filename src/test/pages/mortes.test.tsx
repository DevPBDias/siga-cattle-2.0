import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MortesPage from "@/app/(protected)/mortes/page";
import { mockAnimalList } from "../fixtures/domain-data";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/mortes",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({
    data: mockAnimalList,
    loading: false,
  }),
}));

vi.mock("@/hooks/db/deaths/useCreateDeath", () => ({
  useCreateDeath: () => ({
    actions: { createDeath: vi.fn().mockResolvedValue(undefined) },
  }),
}));

// O DeathForm usa useMovements().actions.createMovement — precisa estar no mock
vi.mock("@/hooks/db/movements/useMovements", () => ({
  useMovements: () => ({
    data: [],
    loading: false,
    actions: {
      createMovement: vi.fn().mockResolvedValue(undefined),
      deleteMovement: vi.fn(),
      updateMovement: vi.fn(),
    },
  }),
}));

vi.mock("@/hooks/db/deaths/useDeaths", () => ({
  useDeaths: () => ({
    data: [
      {
        id: "death-1",
        animal_rgn: "1001",
        date: "2026-02-15",
        reason: "Acidente",
        _deleted: false,
      },
    ],
    loading: false,
  }),
}));

// Mock do DatePicker que pode não estar disponível em jsdom
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ label }: { label: string }) => <label>{label}</label>,
}));

// Mock do PhotoPicker para evitar dependências de câmera / File API
vi.mock("@/components/features/mortes/PhotoPicker", () => ({
  PhotoPicker: () => <div />,
}));

describe("Módulo: Mortes e Baixas (mortes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'Mortes'", () => {
    render(<MortesPage />);
    expect(screen.getByRole("heading", { name: /Mortes/i })).toBeInTheDocument();
  });

  it("deve renderizar as abas de 'Registrar' e 'Histórico'", () => {
    render(<MortesPage />);
    expect(screen.getByText("Registrar")).toBeInTheDocument();
    expect(screen.getByText("Histórico")).toBeInTheDocument();
  });

  it("deve exibir os campos do formulário de registro de óbito", () => {
    render(<MortesPage />);
    // DeathForm renderiza um FormRow com label "Causa da morte"
    expect(screen.getByText(/Causa da morte/i)).toBeInTheDocument();
  });
});
