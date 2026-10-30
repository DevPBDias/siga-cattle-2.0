import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DosesSemenPage from "@/app/(protected)/gerenciar/doses-semen/page";
import { mockSemenDoses } from "../fixtures/domain-data";

// Mock navegação
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/gerenciar/doses-semen",
}));

// Mock Auth
vi.mock("@/components/auth/WrapperAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/forms/useDosesSemenWorkspace", () => ({
  useDosesSemenWorkspace: () => ({
    data: {
      doses: mockSemenDoses,
      loading: false,
    },
    actions: {
      activeTab: "meus-touros",
      setActiveTab: vi.fn(),
    },
  }),
}));

vi.mock("@/hooks/db/doses_semen/useDosesSemen", () => ({
  useDosesSemen: () => ({
    data: mockSemenDoses,
    loading: false,
  }),
}));

vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({
    data: [],
    loading: false,
  }),
}));

describe("Módulo: Touros e Sêmen (doses-semen)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o cabeçalho 'TOUROS / SEMÊN'", () => {
    render(<DosesSemenPage />);
    expect(screen.getByRole("heading", { name: /TOUROS \/ SEMÊN/i })).toBeInTheDocument();
  });

  it("deve renderizar as abas 'Meus touros' e 'Doses'", () => {
    render(<DosesSemenPage />);
    expect(screen.getByText("Meus touros")).toBeInTheDocument();
    expect(screen.getByText("Doses")).toBeInTheDocument();
  });
});

