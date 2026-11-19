import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const tableQuery = { upsert: mocks.upsert, select: mocks.select };
    mocks.upsert.mockReturnValue(tableQuery);
    mocks.select.mockResolvedValue({ data: [], error: null });
    mocks.from.mockReturnValue(tableQuery);
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "00000000-0000-4000-8000-000000000002" } },
          error: null,
        }),
      },
      from: mocks.from,
    });
  });

  it("does not upsert a deleted profile tombstone and recreate its row", async () => {
    const request = new NextRequest("http://localhost/api/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer owner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        table: "user_profiles",
        primaryKey: "id",
        documents: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            role: "member",
            _deleted: true,
            created_at: 1,
            updated_at: 2,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual([]);
  });

  it("normalizes an empty farm_id before pushing an animal", async () => {
    const userId = "00000000-0000-4000-8000-000000000002";
    const orgId = "00000000-0000-4000-8000-000000000003";
    const tableQuery = { upsert: mocks.upsert, select: mocks.select };

    mocks.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: userId, role: "owner", owner_id: null, org_id: orgId },
                error: null,
              }),
            }),
          }),
        };
      }

      return tableQuery;
    });

    const request = new NextRequest("http://localhost/api/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer owner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        table: "animals",
        primaryKey: "animal_key",
        documents: [
          {
            animal_key: "GIRR::206",
            id: "c8a3bcc0-a745-4d4c-97a1-237c259dd7f1",
            rgn: "206",
            farm_id: "",
            _deleted: false,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          animal_key: "GIRR::206",
          farm_id: null,
          org_id: orgId,
        }),
      ],
      { onConflict: "animal_key", ignoreDuplicates: false },
    );
  });

  it("omits a null farm_id when pulling animals for RxDB", async () => {
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockResolvedValue({
      data: [
        {
          animal_key: "GIRR::206",
          rgn: "206",
          farm_id: null,
          updated_at: 1,
        },
      ],
      error: null,
    });
    mocks.from.mockReturnValue(query);

    const request = new NextRequest("http://localhost/api/sync?table=animals", {
      headers: { Authorization: "Bearer owner-token" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        animal_key: "GIRR::206",
        rgn: "206",
        updated_at: 1,
        server_updated_at: 1,
      },
    ]);
  });
});
