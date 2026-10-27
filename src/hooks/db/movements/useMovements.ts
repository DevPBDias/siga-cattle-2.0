"use client";

import { useMemo, useCallback } from "react";
import { useLocalQuery, useLocalMutation } from "@/hooks/core";
import {
  Movement,
  SalePayload,
  MortePayload,
  TrocaPayload,
} from "@/types/movement.type";
import { Sale } from "@/types/sale.type";
import { Death } from "@/types/death.type";
import { Exchange } from "@/types/exchange.type";
import { getDatabase } from "@/db/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import type { MangoQuery } from "rxdb";
import { getSupabase } from "@/lib/supabase/client";

export function useMovements() {
  const query = useMemo<MangoQuery<Movement>>(
    () => ({
      selector: { _deleted: { $eq: false } },
      sort: [{ date: "desc" } as any],
    }),
    [],
  );

  const {
    data,
    loading: queryLoading,
    error: queryError,
    actions: { refetch },
  } = useLocalQuery<Movement>("movements", query);

  const {
    actions: movementActions,
    loading: movementMutationLoading,
    error: movementMutationError,
  } = useLocalMutation<Movement>("movements");

  const { actions: saleActions } = useLocalMutation<Sale>("sales");
  const { actions: deathActions } = useLocalMutation<Death>("deaths");
  const { actions: exchangeActions } = useLocalMutation<Exchange>("exchanges");

  const createMovement = useCallback(
    async (
      data: Omit<
        Movement,
        "id" | "created_at" | "updated_at" | "_deleted" | "details_id"
      > & { details: any },
    ) => {
      try {
        const db = await getDatabase();
        const id = uuidv4();
        const timestamp = Date.now();
        const {
          data: { user },
        } = await getSupabase().auth.getUser();

        // 1. Create the Movement record
        await movementActions.create({
          type: data.type,
          animal_id: data.animal_id,
          date: data.date,
          event_date: data.event_date ?? data.date,
          details_id: "", // Will be patched later
          created_by: user?.id,
          id,
          created_at: timestamp,
          updated_at: timestamp,
          _deleted: false,
        } as Movement);

        // 2. Handle Side Effects based on Type
        if (["morte", "venda", "troca"].includes(data.type)) {
          // 3. Update Animal Status to INATIVO
          const animalDoc = await db.animals.findOne(data.animal_id).exec();
          if (animalDoc) {
            await animalDoc.patch({
              animal_state: "INATIVO",
              updated_at: timestamp,
            });
          }

          // 4. If it's a Venda, also create a record in the 'sales' collection
          if (data.type === "venda") {
            const vendaDetails = data.details as SalePayload;
            const saleId = uuidv4();

            try {
              await saleActions.create({
                id: saleId,
                animal_rgn: data.animal_id,
                client_id: vendaDetails.client_id || "",
                date: data.date,
                total_value: vendaDetails.total_value || 0,
                down_payment: vendaDetails.down_payment || 0,
                payment_method: vendaDetails.payment_method || "",
                installments: vendaDetails.installments || 0,
                installment_value: vendaDetails.installment_value || 0,
                financial_status:
                  vendaDetails.payment_method === "À Vista"
                    ? "pago"
                    : "pendente",
                gta_number: vendaDetails.gta_number || "",
                invoice_number: vendaDetails.invoice_number || "",
                sale_type: vendaDetails.sale_type || "comprado",
                created_at: timestamp,
                updated_at: timestamp,
                _deleted: false,
              });
            } catch (saleErr) {
              console.error("❌ Error inserting sale record:", saleErr);
              toast.error(
                "Movimentação salva, mas erro ao criar registro de venda.",
              );
            }

            // Update movement details with only the reference ID
            const movementDoc = await db.movements.findOne(id).exec();
            if (movementDoc) {
              await movementDoc.patch({
                details_id: saleId,
              });
            }
          }

          // 5. If it's a Morte, also create a record in the 'deaths' collection
          if (data.type === "morte") {
            const morteDetails = data.details as MortePayload;
            const deathId = uuidv4();

            try {
              await deathActions.create({
                id: deathId,
                animal_rgn: data.animal_id,
                date: data.date,
                reason: morteDetails.reason || "",
                mother_name: morteDetails.mother_name,
                photos: morteDetails.photos || [],
                photo_paths: [],
                created_at: timestamp,
                updated_at: timestamp,
                _deleted: false,
              });

              const movementDoc = await db.movements.findOne(id).exec();
              if (movementDoc) {
                await movementDoc.patch({
                  details_id: deathId,
                });
              }
            } catch (deathErr) {
              console.error("❌ Error inserting death record:", deathErr);
            }
          }

          // 6. If it's a Troca, also create a record in the 'exchanges' collection
          if (data.type === "troca") {
            const trocaDetails = data.details as TrocaPayload;
            const exchangeId = uuidv4();

            try {
              await exchangeActions.create({
                id: exchangeId,
                animal_rgn: data.animal_id,
                date: data.date,
                client_id: trocaDetails.client_id || "",
                traded_animal_rgn: data.animal_id,
                substitute_animal_rgn: trocaDetails.substitute_animal_rgn || "",
                created_at: timestamp,
                updated_at: timestamp,
                _deleted: false,
              });

              const movementDoc = await db.movements.findOne(id).exec();
              if (movementDoc) {
                await movementDoc.patch({
                  details_id: exchangeId,
                });
              }
            } catch (exchangeErr) {
              console.error("❌ Error inserting exchange record:", exchangeErr);
            }
          }
        }

        toast.success("Movimentação registrada com sucesso!");
      } catch (err) {
        console.error("Erro ao criar movimentação:", err);
        toast.error("Erro ao registrar movimentação.");
        throw err;
      }
    },
    [movementActions, saleActions, deathActions, exchangeActions],
  );

  const updateMovement = useCallback(
    async (id: string, data: Partial<Movement> & { details?: any }) => {
      try {
        const db = await getDatabase();
        const timestamp = Date.now();

        await movementActions.update(id, {
          type: data.type,
          animal_id: data.animal_id,
          date: data.date,
          details_id: data.details_id,
          id,
          updated_at: timestamp,
        } as Movement);

        // Update corresponding records in specific tables
        const movementDoc = await db.movements.findOne(id).exec();
        const movement = movementDoc?.toJSON() as Movement;

        if (movement) {
          const details_id = movement.details_id;
          const patchData = data.details;

          // Sync Venda
          if (movement.type === "venda" && details_id) {
            const saleDoc = await db.sales.findOne(details_id).exec();
            if (saleDoc && patchData) {
              await saleDoc.patch({
                date: data.date || movement.date,
                animal_rgn: data.animal_id || movement.animal_id,
                client_id: patchData.client_id,
                total_value: patchData.total_value,
                down_payment: patchData.down_payment,
                payment_method: patchData.payment_method,
                installments: patchData.installments,
                installment_value: patchData.installment_value,
                financial_status:
                  patchData.payment_method === "À Vista" ? "pago" : "pendente",
                gta_number: patchData.gta_number,
                invoice_number: patchData.invoice_number,
                sale_type: patchData.sale_type,
                updated_at: timestamp,
              });
            }
          }

          // Sync Morte
          if (movement.type === "morte" && details_id) {
            const deathDoc = await db.deaths.findOne(details_id).exec();
            if (deathDoc && patchData) {
              await deathDoc.patch({
                date: data.date || movement.date,
                animal_rgn: data.animal_id || movement.animal_id,
                reason: patchData.reason,
                updated_at: timestamp,
              });
            }
          }

          // Sync Troca
          if (movement.type === "troca" && details_id) {
            const exchangeDoc = await db.exchanges.findOne(details_id).exec();
            if (exchangeDoc && patchData) {
              await exchangeDoc.patch({
                date: data.date || movement.date,
                animal_rgn: data.animal_id || movement.animal_id,
                client_id: patchData.client_id,
                substitute_animal_rgn: patchData.substitute_animal_rgn,
                updated_at: timestamp,
              });
            }
          }
        }

        toast.success("Movimentação atualizada com sucesso!");
      } catch (err) {
        console.error("Erro ao atualizar movimentação:", err);
        toast.error("Erro ao atualizar movimentação.");
        throw err;
      }
    },
    [movementActions],
  );

  const getMovementsByAnimal = useCallback(
    async (rgn: string): Promise<Movement[]> => {
      const db = await getDatabase();
      if (!db?.movements) return [];
      const docs = await db.movements
        .find({
          selector: {
            animal_id: rgn,
            _deleted: { $eq: false },
          },
        })
        .exec();
      return docs.map((d: any) => d.toJSON() as Movement);
    },
    [],
  );

  const deleteMovement = useCallback(
    async (id: string) => {
      try {
        const db = await getDatabase();
        if (!db) throw new Error("Database not initialized");

        const movementDoc = await db.movements.findOne(id).exec();
        if (!movementDoc) {
          toast.error("Movimentação não encontrada.");
          return;
        }

        const movement = movementDoc.toJSON() as Movement;
        const timestamp = Date.now();

        // 1. Delete associated records
        const details_id = movement.details_id;
        if (movement.type === "venda" && details_id) {
          const saleDoc = await db.sales.findOne(details_id).exec();
          if (saleDoc)
            await saleDoc.patch({ _deleted: true, updated_at: timestamp });
        }
        if (movement.type === "morte" && details_id) {
          const deathDoc = await db.deaths.findOne(details_id).exec();
          if (deathDoc)
            await deathDoc.patch({ _deleted: true, updated_at: timestamp });
        }
        if (movement.type === "troca" && details_id) {
          const exchangeDoc = await db.exchanges.findOne(details_id).exec();
          if (exchangeDoc)
            await exchangeDoc.patch({ _deleted: true, updated_at: timestamp });
        }

        // 2. If it's "morte", "venda" or "troca", restore animal state to "ATIVO"
        if (["morte", "venda", "troca"].includes(movement.type)) {
          const animalDoc = await db.animals.findOne(movement.animal_id).exec();
          if (animalDoc) {
            await animalDoc.patch({
              animal_state: "ATIVO",
              updated_at: timestamp,
            });
          }
        }

        // 3. Soft delete the movement
        await movementDoc.patch({
          _deleted: true,
          updated_at: timestamp,
        });

        toast.success("Movimentação excluída com sucesso!");
        if (refetch) refetch();
      } catch (err) {
        console.error("Erro ao excluir movimentação:", err);
        toast.error("Erro ao excluir movimentação.");
        throw err;
      }
    },
    [refetch],
  );

  return {
    data: data || [],
    loading: queryLoading || movementMutationLoading,
    error: queryError || movementMutationError,
    actions: {
      ...movementActions,
      createMovement,
      updateMovement,
      deleteMovement,
      getMovementsByAnimal,
      refetch,
    },
  };
}
