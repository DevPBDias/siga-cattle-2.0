"use client";

import { useLocalQuery, useLocalMutation } from "@/hooks/core";
import { Sale } from "@/types/sale.type";
import { useMemo, useState } from "react";
import type { MangoQuery } from "rxdb";
import { useLocalDocument } from "@/hooks/core/useLocalDocument";
import { parseDateParts } from "@/utils/dates";

/**
 * Hook reativo para gerenciar a lista de vendas.
 * Oferece busca, filtragem e operações CRUD básicas.
 */
export function useSales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(
    null,
  );

  const query = useMemo<MangoQuery<Sale>>(() => {
    const baseSelector: any = { _deleted: { $eq: false } };

    if (searchQuery) {
      baseSelector.$or = [
        { animal_rgn: { $regex: searchQuery, $options: "i" } },
        { gta_number: { $regex: searchQuery, $options: "i" } },
        { invoice_number: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (clientFilter) {
      baseSelector.client_id = { $eq: clientFilter };
    }

    if (paymentMethodFilter) {
      baseSelector.payment_method = { $eq: paymentMethodFilter };
    }

    return {
      selector: baseSelector,
      sort: [{ date: "desc" } as any],
    };
  }, [searchQuery, clientFilter, paymentMethodFilter]);

  const {
    data: allSales,
    loading: queryLoading,
    error: queryError,
    actions: { refetch },
  } = useLocalQuery<Sale>("sales", query);

  // Filter by year and month after fetching (RxDB date handling)
  const sales = useMemo(() => {
    if (!allSales) return [];

    return allSales.filter((sale) => {
      const parts = parseDateParts(sale.date);
      if (!parts) return false;
      if (yearFilter && parts.year !== yearFilter) return false;
      if (monthFilter && parts.month !== monthFilter) return false;
      return true;
    });
  }, [allSales, yearFilter, monthFilter]);

  const {
    actions: mutationActions,
    loading: mutationLoading,
    error: mutationError,
  } = useLocalMutation<Sale>("sales");

  // Helper to get unique years from sales data
  const availableYears = useMemo(() => {
    if (!allSales) return [];
    const years = new Set(
      allSales
        .map((sale) => parseDateParts(sale.date)?.year)
        .filter((y): y is number => y !== undefined),
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [allSales]);

  return {
    data: sales || [],
    allSales: allSales || [],
    loading: queryLoading || mutationLoading,
    error: queryError || mutationError,
    availableYears,
    actions: {
      ...mutationActions,
      createSale: mutationActions.create,
      updateSale: mutationActions.update,
      deleteSale: mutationActions.remove,
      searchSales: setSearchQuery,
      setYearFilter,
      setMonthFilter,
      setClientFilter,
      setPaymentMethodFilter,
      refetch,
    },
  };
}
