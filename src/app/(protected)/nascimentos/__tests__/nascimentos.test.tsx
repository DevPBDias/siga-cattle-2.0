import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BirthCard } from "@/components/features/nascimentos/BirthCard";
import { BirthHistory } from "@/components/features/nascimentos/BirthHistory";
import { BirthForm } from "@/components/features/nascimentos/BirthForm";
import { Animal } from "@/types/animal.type";

// Mocks para BirthHistory e BirthForm
const mockCreateAnimal = vi.fn().mockResolvedValue({});
const mockUpdateAnimal = vi.fn().mockResolvedValue({});
const mockCreateWeight = vi.fn().mockResolvedValue({});
const mockCreateMovement = vi.fn().mockResolvedValue({});

const mockMovements = [
  {
    id: "mov-1",
    type: "nascimento",
    animal_id: "1001",
    date: "2026-05-10",
    event_date: "2026-05-10",
    created_by: "user-123",
    _deleted: false,
  },
  {
    id: "mov-2",
    type: "nascimento",
    animal_id: "1002",
    date: "2026-06-15",
    event_date: "2026-06-15",
    created_by: "user-123",
    _deleted: false,
  },
];

vi.mock("@/hooks/db/animals/useCreateAnimal", () => ({
  useCreateAnimal: () => ({
    actions: { createAnimal: mockCreateAnimal },
  }),
}));

vi.mock("@/hooks/db/animals/useUpdateAnimal", () => ({
  useUpdateAnimal: () => ({
    actions: { updateAnimal: mockUpdateAnimal },
  }),
}));

vi.mock("@/hooks/db/animal_weights/useCreateAnimalWeight", () => ({
  useCreateAnimalWeight: () => ({
    actions: { createAnimalWeight: mockCreateWeight },
  }),
}));

vi.mock("@/hooks/db/movements/useMovements", () => ({
  useMovements: () => ({
    data: mockMovements,
    loading: false,
    actions: { createMovement: mockCreateMovement },
  }),
}));

vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({
    data: [
      {
        rgn: "1001",
        serie_rgd: "INDI",
        sex: "M",
        born_date: "2026-05-10",
        mother_rgn: "900",
        mother_serie_rgd: "INDI",
        farm_id: "farm-1",
        breed: "Nelore",
      },
      {
        rgn: "1002",
        serie_rgd: "INDI",
        sex: "F",
        born_date: "2026-06-15",
        mother_rgn: "901",
        mother_serie_rgd: "INDI",
        farm_id: "farm-2",
        breed: "Nelore",
      },
      {
        rgn: "9999",
        serie_rgd: "INDI",
        sex: "F",
        born_date: "2024-01-01",
        mother_rgn: "800",
        mother_serie_rgd: "INDI",
        farm_id: "farm-1",
        breed: "Nelore",
      },
    ],
    loading: false,
  }),
}));

vi.mock("@/hooks/db/farms/useFarms", () => ({
  useFarms: () => ({
    data: [
      { id: "farm-1", farm_name: "Fazenda Ouro" },
      { id: "farm-2", farm_name: "Fazenda Prata" },
    ],
    loading: false,
  }),
}));

vi.mock("@/hooks/db/animal_weights", () => ({
  useAnimalWeights: () => ({
    data: [
      { rgn: "1001", value: 34.5, born_metric: true, date: "2026-05-10" },
      { rgn: "1002", value: 32.0, born_metric: true, date: "2026-06-15" },
    ],
  }),
}));

vi.mock("@/hooks/db/user_profiles/useUserProfiles", () => ({
  useUserProfiles: () => ({
    data: [{ id: "user-123", full_name: "Carlos Teste" }],
    loading: false,
  }),
}));

let mockUserRole = "owner";
let mockUserProfile = { farm_name: "Fazenda Ouro", id: "user-123" };

vi.mock("@/hooks/auth/useUserAccess", () => ({
  useUserAccess: () => ({
    role: mockUserRole,
    user: { id: "user-123" },
  }),
}));

vi.mock("@/hooks/db/user_profiles/useUserProfile", () => ({
  useUserProfile: () => ({
    data: mockUserProfile,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabase: () => ({
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

describe("Item 8: Nascimentos e Histórico", () => {
  describe("BirthCard", () => {
    const mockAnimal: Animal = {
      rgn: "5050",
      serie_rgd: "INDI",
      sex: "M",
      born_date: "2026-04-12",
      mother_rgn: "3030",
      mother_serie_rgd: "INDI",
      farm_id: "farm-1",
      breed: "Nelore",
    } as Animal;

    it("deve renderizar o card expansível com todos os campos incluindo created_by", () => {
      render(
        <BirthCard
          animal={mockAnimal}
          date={{ year: 2026, month: 4, day: 12, sortKey: "2026-04-12" }}
          farmName="Fazenda Ouro"
          birthWeightKg={35.2}
          createdBy="José da Silva"
        />,
      );

      // Nome do animal no formato serie_rgd + rgn
      expect(screen.getByText("INDI 5050")).toBeInTheDocument();

      // Data de nascimento visível no trigger
      expect(screen.getByText("12/04/2026")).toBeInTheDocument();

      // Sexo visível no trigger
      expect(screen.getByText("Macho")).toBeInTheDocument();

      // Clica no trigger do accordion para expandir
      const trigger = screen.getByRole("button", {
        name: /Ver detalhes do nascimento INDI 5050/i,
      });
      fireEvent.click(trigger);

      // Mãe
      expect(screen.getByText("INDI 3030")).toBeInTheDocument();

      // Fazenda
      expect(screen.getByText("Fazenda Ouro")).toBeInTheDocument();

      // Peso
      expect(screen.getByText("35.2 kg")).toBeInTheDocument();

      // Criado por (created_by)
      expect(screen.getByText("Criado por")).toBeInTheDocument();
      expect(screen.getByText("José da Silva")).toBeInTheDocument();
    });
  });

  describe("BirthHistory", () => {
    it("deve listar apenas os nascimentos que tenham movimentação do tipo nascimento", () => {
      mockUserRole = "owner";
      render(<BirthHistory />);

      // Animais com movimentação de nascimento
      expect(screen.getByText("INDI 1001")).toBeInTheDocument();
      expect(screen.getByText("INDI 1002")).toBeInTheDocument();

      // Animal sem movimentação de nascimento NÃO deve aparecer
      expect(screen.queryByText("INDI 9999")).not.toBeInTheDocument();
    });

    it("deve limitar o escopo da fazenda quando o usuário for membro", () => {
      mockUserRole = "member";
      mockUserProfile = { farm_name: "Fazenda Ouro", id: "user-123" };

      render(<BirthHistory />);

      // Deve exibir a fazenda vinculada ativa
      expect(screen.getByText("Fazenda vinculada")).toBeInTheDocument();
      expect(screen.getByText("Escopo ativo")).toBeInTheDocument();

      // Apenas o nascimento da Fazenda Ouro deve estar visível
      expect(screen.getByText("INDI 1001")).toBeInTheDocument();
      expect(screen.queryByText("INDI 1002")).not.toBeInTheDocument();
      expect(screen.queryByText("INDI 9999")).not.toBeInTheDocument();
    });
  });

  describe("BirthForm", () => {
    it("deve renderizar o formulário de nascimento", () => {
      mockUserRole = "owner";
      render(<BirthForm />);

      expect(screen.getByText("Sexo do animal")).toBeInTheDocument();
    });
  });
});
