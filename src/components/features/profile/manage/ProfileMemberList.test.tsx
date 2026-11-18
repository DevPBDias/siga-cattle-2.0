import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileMemberList } from "./ProfileMemberList";
import { UserProfile } from "@/types/user_profile.type";

const createProfile = (
  id: string,
  role: "owner" | "member",
  owner_id?: string,
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
});

describe("ProfileMemberList", () => {
  it("allows removing only members linked to the active owner", () => {
    const onRemoveMember = vi.fn();
    const owner = createProfile("owner-1", "owner");
    const farmMember = createProfile("member-1", "member", owner.id);
    const unrelatedMember = createProfile("member-2", "member", "owner-2");

    render(
      <ProfileMemberList
        profiles={[owner, farmMember, unrelatedMember]}
        loading={false}
        editing
        savingId={null}
        ownerId={owner.id}
        onChangeRole={vi.fn()}
        onChangePermission={vi.fn()}
        onRemoveMember={onRemoveMember}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remover member-1 da fazenda" }),
    );

    expect(onRemoveMember).toHaveBeenCalledWith(farmMember);
    expect(
      screen.queryByRole("button", { name: "Remover member-2 da fazenda" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover owner-1 da fazenda" }),
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
        onChangeRole={vi.fn()}
        onChangePermission={vi.fn()}
        onRemoveMember={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Remover member-1 da fazenda" }),
    ).toBeInTheDocument();
  });
});
