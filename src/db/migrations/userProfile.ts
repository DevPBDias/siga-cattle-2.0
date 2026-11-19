type UserProfileDocument = Record<string, unknown>;

const migrateUserProfileToV1 = (oldDocument: UserProfileDocument) => ({
  ...oldDocument,
  role: oldDocument.role === "owner" ? "owner" : "member",
  permissions: oldDocument.permissions ?? {},
});

const migrateUserProfileToV2 = (oldDocument: UserProfileDocument) => {
  const existingOrgId =
    typeof oldDocument.org_id === "string" && oldDocument.org_id.trim()
      ? oldDocument.org_id
      : undefined;
  const linkedOrgId =
    oldDocument.role === "owner" ? oldDocument.id : oldDocument.owner_id;
  const orgId =
    existingOrgId ??
    (typeof linkedOrgId === "string" && linkedOrgId.trim()
      ? linkedOrgId
      : undefined);

  return {
    ...oldDocument,
    role: oldDocument.role === "owner" ? "owner" : "member",
    ...(orgId ? { org_id: orgId } : {}),
  };
};

export const legacyUserProfileMigrationStrategies = {
  1: migrateUserProfileToV1,
};

export const userProfileMigrationStrategies = {
  1: migrateUserProfileToV1,
  2: migrateUserProfileToV2,
};
