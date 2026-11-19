import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  deleteUser: vi.fn(),
  rpc: vi.fn(),
  ownerId: "00000000-0000-4000-8000-000000000002",
  memberId: "00000000-0000-4000-8000-000000000001",
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

function makeRequest(memberId = mocks.memberId) {
  return new NextRequest("http://localhost/api/profile/members/delete", {
    method: "POST",
    headers: {
      Authorization: "Bearer owner-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ memberId }),
  });
}

describe("POST /api/profile/members/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    mocks.createClient.mockImplementation((_url: string, key: string) => {
      if (key === "anon-key") {
        return {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: mocks.ownerId } },
              error: null,
            }),
          },
        };
      }

      const profiles = [
        { role: "owner", org_id: "00000000-0000-4000-8000-000000000003" },
        {
          id: mocks.memberId,
          role: "member",
          owner_id: "00000000-0000-4000-8000-000000000004",
          org_id: "00000000-0000-4000-8000-000000000003",
        },
      ];
      let profileIndex = 0;
      const profileQuery = {
        select: vi.fn(() => profileQuery),
        eq: vi.fn(() => profileQuery),
        maybeSingle: vi.fn(async () => ({
          data: profiles[profileIndex++],
          error: null,
        })),
      };

      return {
        from: vi.fn(() => profileQuery),
        auth: { admin: { deleteUser: mocks.deleteUser } },
        rpc: mocks.rpc,
      };
    });
    mocks.deleteUser.mockResolvedValue({ error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
  });

  it("deletes Auth and profile data only for an owner-linked member", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith(mocks.memberId);
    expect(mocks.rpc).toHaveBeenCalledWith("delete_member_profile", {
      p_member_id: mocks.memberId,
      p_owner_id: mocks.ownerId,
      p_org_id: "00000000-0000-4000-8000-000000000003",
    });
  });

  it("rejects non-owner profiles before deleting the Auth user", async () => {
    mocks.createClient.mockImplementation((_url: string, key: string) => {
      if (key === "anon-key") {
        return {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: mocks.ownerId } },
              error: null,
            }),
          },
        };
      }

      const profileQuery = {
        select: vi.fn(() => profileQuery),
        eq: vi.fn(() => profileQuery),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: "member", org_id: null },
          error: null,
        }),
      };
      return {
        from: vi.fn(() => profileQuery),
        auth: { admin: { deleteUser: mocks.deleteUser } },
        rpc: mocks.rpc,
      };
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(403);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
