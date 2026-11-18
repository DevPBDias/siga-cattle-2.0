import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TENANTS } from "@/config/tenant";
import { TenantLoadingScreen } from "./TenantLoadingScreen";

describe("TenantLoadingScreen", () => {
  it("uses the Haras Luma logo over the requested dark green background", () => {
    render(<TenantLoadingScreen tenantConfig={TENANTS["haras-luma"]} />);

    expect(screen.getByAltText("Fazenda Luma")).toHaveAttribute(
      "src",
      expect.stringContaining("logo_haras_luma.png"),
    );
    expect(screen.getByRole("main")).toHaveClass("bg-[#002B0D]");
    expect(screen.getByText("CARREGANDO ...")).toBeInTheDocument();
  });
});
