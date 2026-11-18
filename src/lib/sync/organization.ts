const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SyncUserProfile {
  id: string;
  role: string | null;
  owner_id: string | null;
}

type OrganizationResolution =
  | { orgId: string; error: null }
  | { orgId: null; error: string };

export function resolveAnimalOrganizationId(
  profile: SyncUserProfile,
  authenticatedUserId: string,
): OrganizationResolution {
  if (profile.id !== authenticatedUserId) {
    return { orgId: null, error: "User profile does not match authenticated user." };
  }

  const orgId =
    profile.role === "owner"
      ? profile.id
      : profile.role === "member"
        ? profile.owner_id
        : null;

  if (!orgId || !UUID_PATTERN.test(orgId)) {
    return {
      orgId: null,
      error: "A valid owner organization ID could not be resolved for this user.",
    };
  }

  return { orgId, error: null };
}
