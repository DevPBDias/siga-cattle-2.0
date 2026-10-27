"use client";

import { useMemo } from "react";
import { useLocalMutation, useLocalQuery } from "@/hooks/core";
import { UserProfile } from "@/types/user_profile.type";
import type { MangoQuery } from "rxdb";

export function useUserProfiles() {
  const query = useMemo<MangoQuery<UserProfile>>(
    () => ({ selector: { _deleted: { $eq: false } } }),
    [],
  );
  const result = useLocalQuery<UserProfile>("user_profiles", query);
  const { actions } = useLocalMutation<UserProfile>("user_profiles");

  return {
    ...result,
    actions: {
      ...result.actions,
      update: actions.update,
      create: actions.create,
      upsert: actions.upsert,
      remove: actions.remove,
    },
  };
}
