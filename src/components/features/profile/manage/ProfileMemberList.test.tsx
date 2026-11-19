import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileMemberList } from "./ProfileMemberList";
import { UserProfile } from "@/types/user_profile.type";

const createProfile = (
  id: string,
  role: "owner" | "member",
  owner_id?: string,
  org_id?: string,
): UserProfile => ({
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
  owner_id,
  org_id,
});

describe("ProfileMemberList", () => {
  it("allows deleting members linked to the active organization", () => {
    const onDeleteMember = vi.fn();
    const owner = createProfile("owner-1", "owner", undefined, "org-1");
    const farmMember = createProfile("member-1", "member", owner.id);
    const orgMember = createProfile("member-2", "member", "owner-2", "org-1");
    const unrelatedMember = createProfile("member-3", "member", "owner-2", "org-2");

    render(
      <ProfileMemberList
        profiles={[owner, farmMember, orgMember, unrelatedMember]}
        loading={false}
        editing
        savingId={null}
        ownerId={owner.id}
        organizationId="org-1"
        canDeleteMembers
        onChangeRole={vi.fn()}
        onChangePermission={vi.fn()}
        onDeleteMember={onDeleteMember}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir member-1 permanentemente" }),
    );

    expect(onDeleteMember).toHaveBeenCalledWith(farmMember);
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir member-2 permanentemente" }),
    );
    expect(onDeleteMember).toHaveBeenCalledWith(orgMember);
    expect(
      screen.queryByRole("button", { name: "Excluir member-3 permanentemente" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir owner-1 permanentemente" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the remove action available when permission editing is disabled", () => {
    const owner = createProfile("owner-1", "owner");
    const member = createProfile("member-1", "member", owner.id);

    render(
      <ProfileMemberList
        profiles={[member]}
        loading={false}
        editing={false}
        savingId={null}
        ownerId={owner.id}
        canDeleteMembers
        onChangeRole={vi.fn()}
        onChangePermission={vi.fn()}
        onDeleteMember={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Excluir member-1 permanentemente" }),
    ).toBeInTheDocument();
  });

  it("hides permanent deletion from non-owners", () => {
    const member = createProfile("member-1", "member", "owner-1", "org-1");

    render(
      <ProfileMemberList
        profiles={[member]}
        loading={false}
        editing
        savingId={null}
        ownerId="member-1"
        organizationId="org-1"
        canDeleteMembers={false}
        onChangeRole={vi.fn()}
        onChangePermission={vi.fn()}
        onDeleteMember={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Excluir member-1 permanentemente" }),
    ).not.toBeInTheDocument();
  });
});
