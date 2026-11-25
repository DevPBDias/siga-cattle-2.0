"use client";

import { useLocalDocument } from "@/hooks/core/useLocalDocument";
import { Sale } from "@/types/sale.type";

export function useSaleById(id: string | null | undefined) {
  const { data, loading, error, actions } = useLocalDocument<Sale>(
    "transactions",
    id,
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
