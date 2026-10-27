import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReplication } from "../createReplication";
import * as authHelper from "@/lib/supabase/auth-helper";

// Mock RxDB replication plugin
vi.mock("rxdb/plugins/replication", () => ({
  replicateRxCollection: vi.fn().mockImplementation((config) => ({
    config,
    error$: {
      subscribe: vi.fn(),
    },
    start: vi.fn(),
  })),
}));

// Mock auth helper
vi.mock("@/lib/supabase/auth-helper", () => ({
  getAuthHeaders: vi.fn(),
  cleanSupabaseDocuments: vi.fn((docs) => docs),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("createReplication", () => {
  const mockDb = {} as any;
  const mockCollection = {
    count: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(10),
    }),
    schema: {
      jsonSchema: {
        primaryKey: "id",
      },
    },
  } as any;

  mockDb.animals = mockCollection;

  const config = {
    collectionName: "animals",
    tableName: "animals",
    replicationIdentifier: "test-replication",
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize replication with correct config", async () => {
    const replicationFactory = createReplication(config);
    await replicationFactory(mockDb, "https://test.supabase.co", "key");

    const { replicateRxCollection } = await import("rxdb/plugins/replication");
    expect(replicateRxCollection).toHaveBeenCalledWith(
      expect.objectContaining({
        replicationIdentifier: "test-replication",
      }),
    );
  });

  describe("pull handler", () => {
    it("should fetch documents from Supabase correctly", async () => {
      const replicationFactory = createReplication(config);
      await replicationFactory(mockDb, "https://test.supabase.co", "key");

      const { replicateRxCollection } =
        await import("rxdb/plugins/replication");
      const pullHandler = (replicateRxCollection as any).mock.calls[0][0].pull
        .handler;

      vi.mocked(authHelper.getAuthHeaders).mockResolvedValue({
        Authorization: "Bearer token",
      });

      const mockData = [
        { id: "1", updated_at: 1704103200000 },
        { id: "2", updated_at: 1704106800000 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        clone: () => ({ json: async () => mockData }),
        json: async () => mockData,
      });

      const result = await pullHandler(
        { updated_at: 1704067200000, last_id: null },
        10,
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(result.documents).toHaveLength(2);
      expect(result.checkpoint.updated_at).toBe(1704106800000);
      expect(result.checkpoint.last_id).toBe("2");
    });

    it("should throw error if auth token is missing", async () => {
      const replicationFactory = createReplication(config);
      await replicationFactory(mockDb, "https://test.supabase.co", "key");

      const { replicateRxCollection } =
        await import("rxdb/plugins/replication");
      const pullHandler = (replicateRxCollection as any).mock.calls[0][0].pull
        .handler;

      vi.mocked(authHelper.getAuthHeaders).mockResolvedValue({});

      await expect(pullHandler({}, 10)).rejects.toThrow(
        "Authentication required for sync",
      );
    });
  });

  describe("push handler", () => {
    it("prepares remote documents and preserves local-only fields", async () => {
      const localPhoto = "data:image/jpeg;base64,local-photo";
      const preparePushDocument = vi.fn(
        async (_doc: any, mappedDocument: any) => ({
          document: {
            ...mappedDocument,
            photos: ["https://storage.example/death-photo.jpg"],
          },
        }),
      );
      const replicationFactory = createReplication({
        ...config,
        mapToSupabase: (doc: any) => ({ id: doc.id, photos: [] }),
        preparePushDocument,
        mapFromSupabase: (doc: any) => doc,
        mergePushResponse: (remote: any, local: any) => ({
          ...remote,
          photos: local.photos,
          photo_paths: remote.photos,
        }),
      } as any);
      await replicationFactory(mockDb, "https://test.supabase.co", "key");

      const { replicateRxCollection } =
        await import("rxdb/plugins/replication");
      const pushHandler = (replicateRxCollection as any).mock.calls[0][0].push
        .handler;

      vi.mocked(authHelper.getAuthHeaders).mockResolvedValue({
        Authorization: "Bearer token",
      });
      const remoteDocuments = [
        { id: "death-1", photos: ["https://storage.example/death-photo.jpg"] },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        clone: () => ({ json: async () => remoteDocuments }),
        json: async () => remoteDocuments,
      });

      const result = await pushHandler([
        {
          newDocumentState: {
            id: "death-1",
            photos: [localPhoto],
            photo_paths: [],
          },
        },
      ]);

      expect(preparePushDocument).toHaveBeenCalledWith(
        expect.objectContaining({ id: "death-1", photos: [localPhoto] }),
        { id: "death-1", photos: [] },
      );
      expect(result[0].photos).toEqual([localPhoto]);
      expect(result[0].photo_paths).toEqual([
        "https://storage.example/death-photo.jpg",
      ]);
    });

    it("should push documents to Supabase correctly", async () => {
      const replicationFactory = createReplication(config);
      await replicationFactory(mockDb, "https://test.supabase.co", "key");

      const { replicateRxCollection } =
        await import("rxdb/plugins/replication");
      const pushHandler = (replicateRxCollection as any).mock.calls[0][0].push
        .handler;

      vi.mocked(authHelper.getAuthHeaders).mockResolvedValue({
        Authorization: "Bearer token",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        clone: () => ({ json: async () => [] }),
        json: async () => [],
      });

      const rows = [{ newDocumentState: { id: "1", name: "Animal 1" } }];

      await pushHandler(rows);

      expect(mockFetch).toHaveBeenCalled();
    });

    it("should throw error if push fails", async () => {
      const replicationFactory = createReplication(config);
      await replicationFactory(mockDb, "https://test.supabase.co", "key");

      const { replicateRxCollection } =
        await import("rxdb/plugins/replication");
      const pushHandler = (replicateRxCollection as any).mock.calls[0][0].push
        .handler;

      vi.mocked(authHelper.getAuthHeaders).mockResolvedValue({
        Authorization: "Bearer token",
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        clone: () => ({ text: async () => "Internal Server Error" }),
        text: async () => "Internal Server Error",
      });

      await expect(pushHandler([{ newDocumentState: {} }])).rejects.toThrow(
        "Push failed: 500",
      );
    });
  });
});
