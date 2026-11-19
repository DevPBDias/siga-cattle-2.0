import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePermissionsPanel } from "./ProfilePermissionsPanel";
import { UserProfile } from "@/types/user_profile.type";

const profileMocks = vi.hoisted(() => ({
  userProfile: null as UserProfile | null,
  profiles: [] as UserProfile[],
  userId: "owner-1",
}));

vi.mock("@/hooks/db/user_profiles/useUserProfile", () => ({
  useUserProfile: () => ({
    data: profileMocks.userProfile,
    user: { id: profileMocks.userId },
  }),
}));

vi.mock("@/hooks/db/user_profiles/useUserProfiles", () => ({
  useUserProfiles: () => ({
    data: profileMocks.profiles,
    loading: false,
    actions: { update: vi.fn(), create: vi.fn() },
  }),
}));

vi.mock("@/hooks/auth/useInviteMember", () => ({
  useInviteMember: () => ({
    data: { savingId: null },
    actions: {
      updateAccess: vi.fn(),
      removeFromFarm: vi.fn(),
    },
  }),
}));

vi.mock("@/components/features/profile/manage/InviteMemberDialog", () => ({
  InviteMemberDialog: () => null,
}));

function createProfile(
  id: string,
  role: "owner" | "member",
  orgId: string,
  ownerId?: string,
): UserProfile {
  return {
    id,
    full_name: id,
    residential_address: "",
    cpf: "",
    phone: "",
    email: `${id}@example.com`,
    farm_name: "",
    farm_state_registration: "",
    farm_address: "",
    farm_city: "",
    farm_car_number: "",
    farm_sigcar: "",
    farm_nirb: "",
    farm_ccir: "",
    created_at: 1,
    updated_at: 1,
    _deleted: false,
    role,
    org_id: orgId,
    owner_id: ownerId,
  };
}

describe("ProfilePermissionsPanel", () => {
  beforeEach(() => {
    profileMocks.userId = "owner-1";
    profileMocks.userProfile = createProfile("owner-1", "owner", "org-1");
    profileMocks.profiles = [
      createProfile("owner-1", "owner", "org-1"),
      createProfile("owner-2", "owner", "org-1"),
      createProfile("member-1", "member", "org-1", "owner-2"),
      createProfile("other-owner", "owner", "org-2"),
    ];
  });

  it("lists all owners and members in the active organization only", () => {
    render(<ProfilePermissionsPanel editing={false} />);

    expect(screen.getByText("owner-1")).toBeInTheDocument();
    expect(screen.getByText("owner-2")).toBeInTheDocument();
    expect(screen.getByText("member-1")).toBeInTheDocument();
    expect(screen.queryByText("other-owner")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Função de owner-2" }),
    ).toBeDisabled();
  });
});
