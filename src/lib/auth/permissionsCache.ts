/**
 * Permissions Cache
 *
 * Stores role + permissions in localStorage so the access guard can
 * read them synchronously on mount — no async flash, no intermediate
 * null states, no dependency on RxDB or Supabase being ready.
 */

import type { UserPermissions, UserRole } from "@/types/permissions.type";

const PERMISSIONS_CACHE_KEY = "rico_ouro_permissions_cache";
const PERMISSIONS_CACHE_TTL_DAYS = 30; // Alinhado com o cache de autenticação offline

export interface CachedPermissions {
  userId: string;
  role: UserRole;
  permissions: UserPermissions;
  cachedAt?: number;
  expiresAt?: number;
}

export function cachePermissions(data: Omit<CachedPermissions, "cachedAt" | "expiresAt"> & Partial<CachedPermissions>): void {
  try {
    const now = Date.now();
    const entry: CachedPermissions = {
      ...data,
      cachedAt: data.cachedAt ?? now,
      expiresAt: data.expiresAt ?? now + PERMISSIONS_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function getCachedPermissions(userId: string): CachedPermissions | null {
  try {
    const stored = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    if (!stored) return null;
    const parsed: CachedPermissions = JSON.parse(stored);
    
    // Only return if it belongs to the current user
    if (parsed.userId !== userId) return null;

    // Verificar expiração do TTL
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      console.warn("[PermissionsCache] Permissões em cache expiradas. Limpando cache.");
      clearPermissionsCache();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPermissionsCache(): void {
  try {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  } catch {
    // ignore
  }
}
