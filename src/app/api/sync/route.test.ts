import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

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
});
