import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import LoginPage from "@/app/login/page";

// O setup global mocka framer-motion com motion.div/span, mas LoginPage usa motion.main.
// Sobrescrevemos aqui para cobrir motion.main também.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ children, ...props }: any) =>
          React.createElement(tag, props, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, {}, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/login",
}));

// Mock hook de mobile
vi.mock("@/hooks/use-mobile", () => ({
  isDesktopDevice: () => false,
  getDeviceHomeRoute: () => "/",
}));

const mockSignIn = vi.fn();
vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({
    actions: { signIn: mockSignIn },
    data: null,
    loading: false,
  }),
}));

vi.mock("@/providers/RxDBProvider", () => ({
  useRxDB: () => ({
    isReady: true,
    isLoading: false,
  }),
}));

vi.mock("@/lib/auth/offlineAuthCache", () => ({
  hasCachedAuth: () => false,
}));

describe("Módulo: Autenticação (login)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar campos de email, senha e botão de login", () => {
    render(<LoginPage />);
    // Os labels usam htmlFor="email" e htmlFor="password"
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
  });

  it("deve permitir preencher credenciais e submeter o formulário", async () => {
    mockSignIn.mockResolvedValueOnce({ user: { id: "1" }, error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: "teste@indiouro.com.br" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: "senha123" },
    });

    const submitBtn = screen.getByRole("button", { name: /Entrar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("teste@indiouro.com.br", "senha123");
    });
  });
});
