import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  ownerId: "00000000-0000-4000-8000-000000000002",
  memberId: "00000000-0000-4000-8000-000000000001",
  ownerProfile: {
    id: "00000000-0000-4000-8000-000000000002",
    role: "owner",
    org_id: null as string | null,
    farm_name: "Fazenda",
    _deleted: false,
  },
  savedProfile: null as Record<string, unknown> | null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

function makeRequest(body: Record<string, unknown> = {
  fullName: "Novo membro",
  email: "novo@example.com",
  password: "nov123",
}) {
  return new NextRequest("http://localhost/api/profile/members/create", {
    method: "POST",
    headers: {
      Authorization: "Bearer owner-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/profile/members/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    mocks.ownerProfile = {
      id: mocks.ownerId,
      role: "owner",
      org_id: null,
      farm_name: "Fazenda",
      _deleted: false,
    };
    mocks.savedProfile = null;
    mocks.createUser.mockResolvedValue({
      data: { user: { id: mocks.memberId } },
      error: null,
    });

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
        maybeSingle: vi.fn().mockImplementation(async () => ({
          data: mocks.ownerProfile,
          error: null,
        })),
        upsert: vi.fn((profile: Record<string, unknown>) => {
          mocks.savedProfile = profile;
          return profileQuery;
        }),
        single: vi.fn().mockImplementation(async () => ({
          data: mocks.savedProfile,
          error: null,
        })),
      };
      return {
        from: vi.fn(() => profileQuery),
        auth: {
          admin: {
            createUser: mocks.createUser,
            deleteUser: mocks.deleteUser,
          },
        },
      };
    });
  });

  it("creates an authenticated member in the owner's fallback organization", async () => {
    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "novo@example.com",
      password: "nov123",
      email_confirm: true,
      user_metadata: { full_name: "Novo membro" },
    });
    expect(mocks.savedProfile).toMatchObject({
      id: mocks.memberId,
      role: "member",
      permissions: { home: true, consulta: true },
      owner_id: mocks.ownerId,
      org_id: mocks.ownerId,
      farm_name: "Fazenda",
    });
    expect(body.profile.id).toBe(mocks.memberId);
  });

  it("rejects non-owner profiles before creating an Auth user", async () => {
    mocks.ownerProfile = { ...mocks.ownerProfile, role: "member" };

    const response = await POST(makeRequest());

    expect(response.status).toBe(403);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects malformed email and password before contacting Supabase", async () => {
    const response = await POST(
      makeRequest({ fullName: "Novo membro", email: "invalid", password: "short" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
