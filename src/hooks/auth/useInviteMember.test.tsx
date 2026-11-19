import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInviteMember } from "./useInviteMember";
import { UserProfile } from "@/types/user_profile.type";

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  fetch: vi.fn(),
  generateUserPassword: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabase: mocks.getSupabase,
}));

vi.mock("@/lib/auth/passwordHelper", () => ({
  generateUserPassword: mocks.generateUserPassword,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

const member: UserProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Membro",
  residential_address: "",
  cpf: "",
  phone: "",
  email: "member@example.com",
  farm_name: "",
  farm_state_registration: "",
  farm_address: "",
  farm_city: "",
  farm_car_number: "",
  farm_sigcar: "",
  farm_nirb: "",
  farm_ccir: "",
  created_at: 1,
  updated_at: 1,
  _deleted: false,
  role: "member",
  owner_id: "00000000-0000-4000-8000-000000000002",
};

describe("useInviteMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    mocks.getSupabase.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "owner-token",
              user: { id: member.owner_id },
            },
          },
          error: null,
        }),
      },
    });
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("deletes the remote account before removing the local profile", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const removeLocal = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInviteMember());
    let removed = false;

    await act(async () => {
      removed = await result.current.actions.deleteMemberAccount(
        member,
        member.owner_id!,
        removeLocal,
      );
    });

    expect(removed).toBe(true);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/profile/members/delete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer owner-token",
        }),
        body: JSON.stringify({ memberId: member.id }),
      }),
    );
    expect(removeLocal).toHaveBeenCalledWith(member.id);
  });

  it("creates a member through the authenticated server route and stores the returned profile locally", async () => {
    mocks.generateUserPassword.mockReturnValue("new123");
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ profile: member }),
    });
    const createLocal = vi.fn().mockResolvedValue(member);
    const { result } = renderHook(() => useInviteMember());
    let created = false;

    await act(async () => {
      created = await result.current.actions.invite({
        fullName: " Novo membro ",
        email: "NEW@EXAMPLE.COM ",
        ownerId: member.owner_id,
        createLocal,
      });
    });

    expect(created).toBe(true);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/profile/members/create",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer owner-token",
        }),
        body: JSON.stringify({
          fullName: "Novo membro",
          email: "new@example.com",
          password: "new123",
        }),
      }),
    );
    expect(createLocal).toHaveBeenCalledWith(member);
    expect(result.current.data.credentials).toEqual({
      email: "new@example.com",
      password: "new123",
      role: "member",
    });
  });

  it("preserves the local profile when the server rejects deletion", async () => {
    mocks.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Exclusão negada." }),
    });
    const removeLocal = vi.fn();
    const { result } = renderHook(() => useInviteMember());
    let removed = true;

    await act(async () => {
      removed = await result.current.actions.deleteMemberAccount(
        member,
        member.owner_id!,
        removeLocal,
      );
    });

    expect(removed).toBe(false);
    expect(removeLocal).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith("Exclusão negada.");
  });

  it("writes role changes locally and leaves remote sync to RxDB", async () => {
    const updateLocal = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInviteMember());

    await act(async () => {
      await result.current.actions.updateAccess(
        member,
        { role: "owner" },
        updateLocal,
      );
    });

    expect(updateLocal).toHaveBeenCalledWith(
      member.id,
      expect.objectContaining({ role: "owner" }),
    );
    expect(mocks.getSupabase).not.toHaveBeenCalled();
  });
});
