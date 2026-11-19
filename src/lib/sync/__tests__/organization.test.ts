import { describe, expect, it } from "vitest";
import { resolveAnimalOrganizationId } from "@/lib/sync/organization";

const ownerId = "2ebc5502-9848-4ed1-b823-98f212ea166f";
const memberId = "67be0c31-90fc-49a4-820e-77a903867508";

describe("resolveAnimalOrganizationId", () => {
  it("uses the owner's profile ID as the organization ID", () => {
    expect(
      resolveAnimalOrganizationId(
        { id: ownerId, role: "owner", owner_id: null, org_id: null },
        ownerId,
      ),
    ).toEqual({ orgId: ownerId, error: null });
  });

  it("uses the owner's ID for a member's organization", () => {
    expect(
      resolveAnimalOrganizationId(
        { id: memberId, role: "member", owner_id: ownerId, org_id: null },
        memberId,
      ),
    ).toEqual({ orgId: ownerId, error: null });
  });

  it("uses the shared organization ID for co-owners", () => {
    const sharedOrgId = "22222222-2222-4222-8222-222222222222";

    expect(
      resolveAnimalOrganizationId(
        {
          id: ownerId,
          role: "owner",
          owner_id: null,
          org_id: sharedOrgId,
        },
        ownerId,
      ),
    ).toEqual({ orgId: sharedOrgId, error: null });
  });

  it("rejects profiles without a valid owner organization", () => {
    expect(
      resolveAnimalOrganizationId(
        { id: memberId, role: "member", owner_id: null, org_id: null },
        memberId,
      ).orgId,
    ).toBeNull();
  });

  it("rejects a profile that does not belong to the authenticated user", () => {
    expect(
      resolveAnimalOrganizationId(
        { id: ownerId, role: "owner", owner_id: null, org_id: null },
        memberId,
      ).orgId,
    ).toBeNull();
  });
});
