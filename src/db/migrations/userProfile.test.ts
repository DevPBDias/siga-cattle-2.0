import { describe, expect, it } from "vitest";
import {
  legacyUserProfileMigrationStrategies,
  userProfileMigrationStrategies,
} from "./userProfile";

describe("user profile migrations", () => {
  it("provides every strategy for migrations through schema version 2", () => {
    expect(typeof userProfileMigrationStrategies[1]).toBe("function");
    expect(typeof userProfileMigrationStrategies[2]).toBe("function");
  });

  it("defaults unknown legacy roles to member", () => {
    expect(
      legacyUserProfileMigrationStrategies[1]({
        id: "member-id",
        permissions: null,
      }),
    ).toMatchObject({
      role: "member",
      permissions: {},
    });
  });

  it("derives organization IDs for legacy owners and members", () => {
    expect(
      userProfileMigrationStrategies[2]({
        id: "owner-id",
        role: "owner",
      }).org_id,
    ).toBe("owner-id");
    expect(
      userProfileMigrationStrategies[2]({
        id: "member-id",
        role: "member",
        owner_id: "owner-id",
      }).org_id,
    ).toBe("owner-id");
  });
});
