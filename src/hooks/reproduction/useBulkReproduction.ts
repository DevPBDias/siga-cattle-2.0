"use client";

import { useState, useMemo } from "react";
import { Animal } from "@/types/animal.type";
import {
  BulkReproductionPayload,
  BulkReproductionResult,
  createBulkReproductionEvents,
  syncReproductionEventsByIds,
} from "@/lib/services/reproduction";
import { getAnimalKeyFromReference } from "@/utils/animalIdentity";

export type BulkReproductionStatus =
  | "pending"
  | "syncing"
  | "success"
  | "error";

export function useBulkReproduction() {
  const [selectedCows, setSelectedCows] = useState<Animal[]>([]);
  const [checkedCowRgns, setCheckedCowRgns] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, BulkReproductionStatus>>(
    {},
  );
  const [failedEventIds, setFailedEventIds] = useState<string[]>([]);
  const [failedCowRgns, setFailedCowRgns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedCows.length;
  const completedCount = useMemo(
    () =>
      Object.values(statusMap).filter((status) => status === "success").length,
    [statusMap],
  );
  const progressPercentage = selectedCount
    ? Math.round((completedCount / selectedCount) * 100)
    : 0;
  const hasErrors = Object.values(statusMap).some(
    (status) => status === "error",
  );

  const addCow = (cow: Animal): boolean => {
    const cowKey = getAnimalKeyFromReference(cow);
    if (
      selectedCows.some(
        (item) => getAnimalKeyFromReference(item) === cowKey,
      )
    ) {
      return false;
    }

    setSelectedCows((prev) => [cow, ...prev]);
    return true;
  };

  const removeCow = (animalKey: string) => {
    setSelectedCows((prev) =>
      prev.filter((cow) => getAnimalKeyFromReference(cow) !== animalKey),
    );
    setCheckedCowRgns((prev) => {
      const next = new Set(prev);
      next.delete(animalKey);
      return next;
    });
    setStatusMap((prev) => {
      const next = { ...prev };
      delete next[animalKey];
      return next;
    });
  };

  const clearCows = () => {
    setSelectedCows([]);
    setCheckedCowRgns(new Set());
    setStatusMap({});
    setFailedEventIds([]);
    setFailedCowRgns([]);
    setError(null);
  };

  const toggleCowSelection = (rgn: string) => {
    setCheckedCowRgns((prev) => {
      const next = new Set(prev);
      if (next.has(rgn)) {
        next.delete(rgn);
      } else {
        next.add(rgn);
      }
      return next;
    });
  };

  const removeSelectedCows = () => {
    if (checkedCowRgns.size === 0) {
      return;
    }

    setSelectedCows((prev) =>
      prev.filter(
        (cow) => !checkedCowRgns.has(getAnimalKeyFromReference(cow)),
      ),
    );
    setCheckedCowRgns(new Set());
    setStatusMap((prev) => {
      const next = { ...prev };
      checkedCowRgns.forEach((animalKey) => delete next[animalKey]);
      return next;
    });
  };

  const initializeStatuses = (status: BulkReproductionStatus) => {
    const nextStatuses: Record<string, BulkReproductionStatus> = {};
    selectedCows.forEach((cow) => {
      nextStatuses[getAnimalKeyFromReference(cow)] = status;
    });
    setStatusMap(nextStatuses);
  };

  const createEvents = async (
    payload: BulkReproductionPayload,
  ): Promise<BulkReproductionResult> => {
    if (selectedCows.length === 0) {
      const result: BulkReproductionResult = {
        insertedEvents: [],
        synced: false,
        error: "Nenhuma matriz selecionada.",
      };
      setError(result.error ?? null);
      return result;
    }

    setError(null);
    setIsProcessing(true);
    initializeStatuses("syncing");

    try {
      const result = await createBulkReproductionEvents(
        selectedCows,
        payload,
      );

      const nextStatus = selectedCows.reduce<Record<string, BulkReproductionStatus>>(
        (acc, cow) => {
          acc[getAnimalKeyFromReference(cow)] = result.synced ? "success" : "error";
          return acc;
        },
        {},
      );

      setStatusMap(nextStatus);
      setFailedEventIds(result.synced ? [] : result.insertedEvents.map((event) => event.event_id));
      setFailedCowRgns(
        result.synced
          ? []
          : selectedCows.map((cow) => getAnimalKeyFromReference(cow)),
      );
      setError(result.error ?? null);

      if (result.synced) {
        clearCows();
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const retryFailedSync = async (): Promise<BulkReproductionResult> => {
    if (failedEventIds.length === 0) {
      return {
        insertedEvents: [],
        synced: true,
      };
    }

    setError(null);
    setIsProcessing(true);
    setStatusMap((prev) => {
      const next = { ...prev };
      failedCowRgns.forEach((animalKey) => {
        if (next[animalKey] !== "success") {
          next[animalKey] = "syncing";
        }
      });
      return next;
    });

    try {
      const result = await syncReproductionEventsByIds(failedEventIds);
      const nextStatus = selectedCows.reduce<Record<string, BulkReproductionStatus>>(
        (acc, cow) => {
          const animalKey = getAnimalKeyFromReference(cow);
          if (failedCowRgns.includes(animalKey)) {
            acc[animalKey] = result.synced ? "success" : "error";
          } else {
            acc[animalKey] = statusMap[animalKey] ?? "pending";
          }
          return acc;
        },
        {},
      );

      setStatusMap(nextStatus);
      if (result.synced) {
        setFailedEventIds([]);
        setFailedCowRgns([]);
        clearCows();
      }
      setError(result.error ?? null);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    selectedCows,
    selectedCount,
    checkedCowRgns,
    statusMap,
    addCow,
    removeCow,
    clearCows,
    toggleCowSelection,
    removeSelectedCows,
    createEvents,
    retryFailedSync,
    isProcessing,
    error,
    hasErrors,
    progressPercentage,
    failedCowRgns,
    failedEventIds,
  };
}
