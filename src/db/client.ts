"use client";

import { createRxDatabase, addRxPlugin, RxJsonSchema, RxStorage } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { animalSchema } from "./schemas/animal.schema";
import { vaccineSchema } from "./schemas/vaccine.schema";
import { farmSchema } from "./schemas/farm.schema";
import { userProfileSchema } from "./schemas/user_profile.schema";
import { MyDatabase, MyDatabaseCollections } from "./collections";
import { animalMetricCESchema } from "./schemas/animal_metric_ce.schema";
import { animalMetricWeightSchema } from "./schemas/animal_metric_weight.schema";
import { animalVaccineSchema } from "./schemas/animal_vaccines.type";
import { reproductionEventSchema } from "./schemas/reproduction_event.schema";
import { animalStatusSchema } from "./schemas/animal_status.schema";
import { semenDoseSchema } from "./schemas/semen_dose.schema";
import { lastWriteWins } from "./replication/base/conflictResolver";
import { RxConflictHandler, defaultConflictHandler } from "rxdb";
import { animalSituationSchema } from "./schemas/animal_situation.schema";
import { clientSchema } from "./schemas/client.schema";
import { movementSchema } from "./schemas/movement.schema";
import { saleSchema } from "./schemas/sale.schema";
import { deathSchema } from "./schemas/death.schema";
import { exchangeSchema } from "./schemas/exchange.schema";
import { setupReplication } from "./replication";
import { getAnimalKey, normalizeAnimalRegistration } from "@/utils/animalIdentity";
import { v4 as uuidv4 } from "uuid";

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBMigrationPlugin);

let devModeLoaded = false;

async function loadDevModePlugin(): Promise<void> {
  if (devModeLoaded || process.env.NODE_ENV !== "development") {
    return;
  }

  try {
    const { RxDBDevModePlugin } = await import("rxdb/plugins/dev-mode");
    addRxPlugin(RxDBDevModePlugin);
    devModeLoaded = true;
    console.log("[RxDB] Dev-mode plugin loaded");
  } catch (err) {
    console.warn("[RxDB] Failed to load dev-mode plugin", err);
  }
}

const DB_VERSION = "v2";
const DB_NAME = `indi_ouro_db_${DB_VERSION}`;
const LEGACY_DB_NAME = "indi_ouro_db_v1";

const LEGACY_COLLECTIONS = [
  "animals",
  "vaccines",
  "farms",
  "user_profiles",
  "animal_metrics_ce",
  "animal_metrics_weight",
  "animal_vaccines",
  "reproduction_events",
  "animal_statuses",
  "animal_situations",
  "semen_doses",
  "clients",
  "movements",
  "sales",
  "deaths",
  "exchanges",
] as const;

function legacySchema<T>(
  schema: RxJsonSchema<T>,
  version: number,
  removedProperties: string[] = [],
): RxJsonSchema<T> {
  const result = JSON.parse(JSON.stringify(schema)) as RxJsonSchema<T>;
  result.version = version;
  for (const property of removedProperties) {
    Reflect.deleteProperty(result.properties, property);
    if (result.required) {
      result.required = result.required.filter((required) => required !== property);
    }
  }
  return result;
}

const animalMigrationStrategies = {
  1: (oldDocument: Record<string, unknown>) => ({
    ...oldDocument,
    is_natural_bull: oldDocument.is_natural_bull === true,
  }),
  2: (oldDocument: Record<string, unknown>) => oldDocument,
  3: (oldDocument: Record<string, unknown>) => oldDocument,
  4: (oldDocument: Record<string, unknown>) => ({
    ...oldDocument,
    breed: (oldDocument.breed as string) || "Nelore",
  }),
  5: (oldDocument: Record<string, unknown>) => ({
    ...oldDocument,
    animal_image: oldDocument.animal_image ?? undefined,
  }),
  6: (oldDocument: Record<string, unknown>) => ({
    ...oldDocument,
    animal_key: getAnimalKey({
      serie_rgd: String(oldDocument.serie_rgd ?? ""),
      rgn: String(oldDocument.rgn ?? ""),
    }),
    id: oldDocument.id ?? uuidv4(),
  }),
};

const legacyAnimalMigrationStrategies = {
  1: animalMigrationStrategies[1],
  2: animalMigrationStrategies[2],
  3: animalMigrationStrategies[3],
  4: animalMigrationStrategies[4],
  5: animalMigrationStrategies[5],
};

async function loadLegacyAnimalDocuments(): Promise<
  Map<string, Record<string, unknown>[]> | null
> {
  if (typeof indexedDB === "undefined") return null;
  const migrationKey = "animal_identity_v2_migrated";
  if (localStorage.getItem(migrationKey) === "true") return null;

  const legacyDb = await createRxDatabase<MyDatabaseCollections>({
    name: LEGACY_DB_NAME,
    storage: getStorage(),
    multiInstance: true,
    ignoreDuplicate: process.env.NODE_ENV === "development",
    eventReduce: true,
  });

  try {
    const oldAnimalSchema = legacySchema(animalSchema, 5, ["animal_key", "id"]);
    oldAnimalSchema.primaryKey = "rgn";
    delete oldAnimalSchema.indexes;

    await legacyDb.addCollections({
      animals: {
        schema: oldAnimalSchema,
        migrationStrategies: legacyAnimalMigrationStrategies,
      },
      vaccines: { schema: vaccineSchema },
      farms: { schema: farmSchema },
      user_profiles: {
        schema: userProfileSchema,
        migrationStrategies: {
          1: (oldDocument: Record<string, unknown>) => ({
            ...oldDocument,
            role: oldDocument.role ?? "owner",
            permissions: oldDocument.permissions ?? {},
          }),
        },
      },
      animal_metrics_ce: {
        schema: legacySchema(animalMetricCESchema, 0, ["animal_key"]),
      },
      animal_metrics_weight: {
        schema: legacySchema(animalMetricWeightSchema, 0, ["animal_key"]),
      },
      animal_vaccines: {
        schema: legacySchema(animalVaccineSchema, 0, ["animal_key"]),
      },
      reproduction_events: {
        schema: legacySchema(reproductionEventSchema, 1, ["animal_key"]),
        migrationStrategies: {
          1: (oldDoc: Record<string, unknown>) => ({
            ...oldDoc,
            d11_date: oldDoc.d11_date ?? undefined,
          }),
        },
      },
      animal_statuses: { schema: animalStatusSchema },
      animal_situations: { schema: animalSituationSchema },
      semen_doses: { schema: semenDoseSchema },
      clients: { schema: clientSchema },
      movements: {
        schema: legacySchema(movementSchema, 1, ["animal_key"]),
        migrationStrategies: {
          1: (oldDocument: Record<string, unknown>) => ({
            ...oldDocument,
            event_date: oldDocument.event_date ?? oldDocument.date,
          }),
        },
      },
      sales: { schema: legacySchema(saleSchema, 0, ["animal_key"]) },
      deaths: {
        schema: legacySchema(deathSchema, 1, ["animal_key"]),
        migrationStrategies: {
          1: (oldDocument: Record<string, unknown>) => ({
            ...oldDocument,
            photos: Array.isArray(oldDocument.photos) ? oldDocument.photos : [],
            photo_paths: Array.isArray(oldDocument.photo_paths)
              ? oldDocument.photo_paths
              : [],
          }),
        },
      },
      exchanges: {
        schema: legacySchema(exchangeSchema, 0, [
          "animal_key",
          "traded_animal_key",
          "substitute_animal_key",
        ]),
      },
    } as any);

    const legacyDocuments = new Map<string, Record<string, unknown>[]>();
    for (const collectionName of LEGACY_COLLECTIONS) {
      const collection = (legacyDb as any)[collectionName];
      const documents = await collection.find().exec();
      legacyDocuments.set(
        collectionName,
        documents.map((document: { toJSON: () => Record<string, unknown> }) =>
          document.toJSON(),
        ),
      );
    }

    const animals = legacyDocuments.get("animals") ?? [];
    const animalsByRgn = new Map<string, Record<string, unknown>[]>();
    for (const animal of animals) {
      const registration = getAnimalKey({
        serie_rgd: String(animal.serie_rgd ?? ""),
        rgn: String(animal.rgn ?? ""),
      });
      animal.animal_key = registration;

      const normalizedRgn = normalizeAnimalRegistration(String(animal.rgn ?? ""));
      const matchingAnimals = animalsByRgn.get(normalizedRgn) ?? [];
      matchingAnimals.push(animal);
      animalsByRgn.set(normalizedRgn, matchingAnimals);
    }

    for (const collectionName of LEGACY_COLLECTIONS) {
      if (collectionName === "animals") continue;
      const documents = legacyDocuments.get(collectionName) ?? [];
      for (const document of documents) {
        const linkedFields =
          collectionName === "exchanges"
            ? [
                ["animal_rgn", "animal_key"],
                ["traded_animal_rgn", "traded_animal_key"],
                ["substitute_animal_rgn", "substitute_animal_key"],
              ]
            : [
                [
                  collectionName === "movements"
                    ? "animal_id"
                    : collectionName === "deaths" || collectionName === "sales"
                      ? "animal_rgn"
                      : "rgn",
                  collectionName === "movements" ? "animal_key" : "animal_key",
                ],
              ];

        for (const [rgnField, keyField] of linkedFields) {
          if (typeof document[keyField] === "string" && document[keyField]) continue;
          const rgn = document[rgnField];
          if (typeof rgn !== "string") continue;
          const matchingAnimals = animalsByRgn.get(normalizeAnimalRegistration(rgn));
          if (matchingAnimals?.length === 1) {
            document[keyField] = matchingAnimals[0].animal_key;
          }
        }
      }
    }

    return legacyDocuments;
  } finally {
    await legacyDb.close();
  }
}

async function migrateLegacyAnimalDatabase(
  targetDb: MyDatabase,
  legacyDocuments: Map<string, Record<string, unknown>[]> | null,
): Promise<void> {
  if (!legacyDocuments) return;

  for (const collectionName of LEGACY_COLLECTIONS) {
    const collection = (targetDb as any)[collectionName];
    const documents = legacyDocuments.get(collectionName) ?? [];
    for (let offset = 0; offset < documents.length; offset += 100) {
      await Promise.all(
        documents.slice(offset, offset + 100).map((document) =>
          collection.upsert(document),
        ),
      );
    }
  }
  localStorage.setItem("animal_identity_v2_migrated", "true");
}

let storageInstance: RxStorage<any, any> | null = null;

function getStorage() {
  if (!storageInstance) {
    storageInstance = getRxStorageDexie();
    if (process.env.NODE_ENV === "development") {
      storageInstance = wrappedValidateAjvStorage({
        storage: storageInstance,
      });
    }
  }
  return storageInstance;
}

let dbInstance: MyDatabase | null = null;
let dbPromise: Promise<MyDatabase> | null = null;

async function createDatabase(): Promise<MyDatabase> {
  await loadDevModePlugin();

  // The legacy and current databases each contain 16 collections; read and
  // close the legacy database before opening the current one.
  const legacyDocuments = await loadLegacyAnimalDocuments();
  const storage = getStorage();

  try {
    const db = await createRxDatabase<MyDatabaseCollections>({
      name: DB_NAME,
      storage: storage,
      multiInstance: true,
      ignoreDuplicate: process.env.NODE_ENV === "development",
      eventReduce: true,
    });

    const collectionsCount = Object.keys(db.collections).length;
    if (collectionsCount > 0) {
      if (!db.user_profiles) {
        await db.addCollections({
          user_profiles: {
            schema: userProfileSchema,
            conflictHandler: {
              isEqual: defaultConflictHandler.isEqual,
              resolve: async (i: any) =>
                lastWriteWins(i.newDocumentState, i.realMasterState),
            },
            migrationStrategies: {
              1: (oldDocument: Record<string, unknown>) => ({
                ...oldDocument,
                role: oldDocument.role ?? "owner",
                permissions: oldDocument.permissions ?? {},
              }),
            },
          },
        });
        console.log("[RxDB] user_profiles migrated to v1 in existing database");
      }
      await migrateLegacyAnimalDatabase(db, legacyDocuments);
      console.log(
        `[RxDB] Database already has ${collectionsCount} collections, skipping addCollections`,
      );
      // BUG-03 FIX: Don't return early — still need to set up replication
      // (it's a no-op if already configured, but critical on hot-reload/multi-context)
      setupReplication(db).catch((err: Error) => {
        console.warn("[RxDB] Replication setup on existing db:", err);
      });
      return db;
    }

    try {
      const customConflictHandler: RxConflictHandler<any> = {
        isEqual: defaultConflictHandler.isEqual,
        resolve: async (i) => {
          return lastWriteWins(i.newDocumentState, i.realMasterState);
        },
      };

      await db.addCollections({
        animals: {
          schema: animalSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            ...animalMigrationStrategies,
          },
        },
        vaccines: {
          schema: vaccineSchema,
          conflictHandler: customConflictHandler,
        },
        farms: { schema: farmSchema, conflictHandler: customConflictHandler },
        user_profiles: {
          schema: userProfileSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => ({
              ...oldDocument,
              role: oldDocument.role ?? "owner",
              permissions: oldDocument.permissions ?? {},
            }),
          },
        },
        animal_metrics_ce: {
          schema: animalMetricCESchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
        animal_metrics_weight: {
          schema: animalMetricWeightSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
        animal_vaccines: {
          schema: animalVaccineSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
        reproduction_events: {
          schema: reproductionEventSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDoc) => {
              return { ...oldDoc, d11_date: oldDoc.d11_date ?? undefined };
            },
            2: (oldDoc) => oldDoc,
          },
        },
        animal_statuses: {
          schema: animalStatusSchema,
          conflictHandler: customConflictHandler,
        },
        animal_situations: {
          schema: animalSituationSchema,
          conflictHandler: customConflictHandler,
        },
        semen_doses: {
          schema: semenDoseSchema,
          conflictHandler: customConflictHandler,
        },
        clients: {
          schema: clientSchema,
          conflictHandler: customConflictHandler,
        },
        movements: {
          schema: movementSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => ({
              ...oldDocument,
              event_date: oldDocument.event_date ?? oldDocument.date,
            }),
            2: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
        sales: {
          schema: saleSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
        deaths: {
          schema: deathSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => ({
              ...oldDocument,
              photos: Array.isArray(oldDocument.photos) ? oldDocument.photos : [],
              photo_paths: Array.isArray(oldDocument.photo_paths)
                ? oldDocument.photo_paths
                : [],
            }),
            2: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
        exchanges: {
          schema: exchangeSchema,
          conflictHandler: customConflictHandler,
          migrationStrategies: {
            1: (oldDocument: Record<string, unknown>) => oldDocument,
          },
        },
      });
    } catch (err: any) {
      console.error("[RxDB] Failed to add collections:", err);

      try {
        await db.close();
      } catch (closeErr) {
        console.error(
          "[RxDB] Failed to close db after collection error",
          closeErr,
        );
      }

      if (err.message?.includes("schema") || err.name === "RxError") {
        console.warn(
          "[RxDB] Schema mismatch detected. You might need to increment collection version or DB_VERSION.",
        );
      }
      throw err;
    }

    await migrateLegacyAnimalDatabase(db, legacyDocuments);
    return db;
  } catch (err) {
    console.error("[RxDB] Error creating database:", err);
    throw err;
  }
}

export async function getDatabase(): Promise<MyDatabase> {
  if (typeof window === "undefined") {
    return null as any;
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = createDatabase()
    .then((db) => {
      dbInstance = db;
      return db;
    })
    .catch(async (error) => {
      console.error("[RxDB] Critical initialization error:", error);
      dbPromise = null;
      dbInstance = null;
      throw error;
    });

  return dbPromise as Promise<MyDatabase>;
}

export async function clearAllDatabases(): Promise<void> {
  if (typeof window === "undefined") return;

  console.log("[RxDB] Starting full local database purge...");

  if (dbInstance) {
    try {
      await dbInstance.close();
      dbInstance = null;
      dbPromise = null;
    } catch (err) {
      console.error("[RxDB] Error destroying current instance:", err);
    }
  }

  try {
    const preservedLocalStorageKeys = ["rico_ouro_market_quotes"];
    const preservedLocalStorage = Object.fromEntries(
      preservedLocalStorageKeys
        .map((key) => [key, localStorage.getItem(key)] as const)
        .filter(([, value]) => value !== null),
    );
    localStorage.clear();
    Object.entries(preservedLocalStorage).forEach(([key, value]) => {
      if (typeof value === "string") localStorage.setItem(key, value);
    });
    console.log("[RxDB] LocalStorage cleared");
  } catch (e) {}

  try {
    sessionStorage.clear();
  } catch (e) {}

  try {
    if (window.indexedDB && (window.indexedDB as any).databases) {
      const dbs = await (window.indexedDB as any).databases();

      for (const dbInfo of dbs) {
        const name = dbInfo.name;
        if (!name) continue;

        const shouldDelete =
          name.includes("indi_ouro") ||
          name.includes("rxdb") ||
          name.includes("dexie") ||
          name.includes("offline-sync");

        if (shouldDelete) {
          console.log(`[RxDB] Purging IndexedDB: ${name}`);
          await new Promise<void>((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(name);
            request.onsuccess = () => {
              console.log(`[RxDB] IndexedDB deleted: ${name}`);
              resolve();
            };
            request.onerror = (event) => {
              console.error("[RxDB] Failed to delete IndexedDB:", name, event);
              // Mesmo em caso de erro, seguimos para evitar travar o reset
              resolve();
            };
            request.onblocked = () => {
              console.warn(
                "[RxDB] Delete blocked for IndexedDB:",
                name,
                "- close other tabs if possible.",
              );
              // Outra aba pode manter uma conexÃ£o aberta. O logout nÃ£o pode
              // ficar aguardando indefinidamente por essa exclusÃ£o.
              setTimeout(resolve, 300);
            };
          });
        }
      }
    } else {
      const commonNames = [
        "indi_ouro_db",
        "indi_ouro_db_v1",
        "indi_ouro_db_v2",
        "indi_ouro_db_v3",
        "indi_ouro_db_v4",
        "indi_ouro_db_v5",
        "indi_ouro_db_v6",
        "indi_ouro_db_v7",
        "indi_ouro_db_v8",
        "indi_ouro_db_v9",
        "indi_ouro_db_v10",
        "indi_ouro_db_v11",
        "indi_ouro_db_v12",
        "indi_ouro_db_v13",
        "indi_ouro_db_v14",
        "indi_ouro_db_v15",
        "indi_ouro_db_v16",
        "indi_ouro_db_v17",
        "offline-sync-queue",
      ];
      for (const name of commonNames) {
        await new Promise<void>((resolve) => {
          const request = window.indexedDB.deleteDatabase(name);
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
          request.onblocked = () => resolve();
        });
      }
    }
    console.log("[RxDB] Full purge complete.");
  } catch (err) {
    console.error("[RxDB] Critical error during database cleanup:", err);
  } finally {
    // Informa o provider mesmo quando algum banco nÃ£o pÃ´de ser excluÃ­do.
    window.dispatchEvent(new Event("rxdb-cleared"));
  }
}

export function isDatabaseReady(): boolean {
  return dbInstance !== null;
}
