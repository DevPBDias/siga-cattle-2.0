"use client";

import { useLocalMutation } from "@/hooks/core";
import { WeaningRecord } from "@/types/weaning_record.type";
import { v4 as uuidv4 } from "uuid";

export function useCreateWeaningRecord() {
  const { loading, error, actions } =
    useLocalMutation<WeaningRecord>("weaning_records");

  const createWeaningRecord = (
    data: Omit<
      WeaningRecord,
      "id" | "created_at" | "updated_at" | "_deleted"
    >,
  ): Promise<WeaningRecord> =>
    actions.create({
      ...data,
      id: uuidv4(),
    });

  return {
    loading,
    error,
    actions: { ...actions, createWeaningRecord },
  };
}
