import { describe, expect, it } from "vitest";
import { isCommercialMovement } from "./MovementList";

describe("isCommercialMovement", () => {
  it("inclui apenas movimentacoes comerciais no historico", () => {
    expect(isCommercialMovement({ type: "morte" })).toBe(true);
    expect(isCommercialMovement({ type: "venda" })).toBe(true);
    expect(isCommercialMovement({ type: "troca" })).toBe(true);
    expect(isCommercialMovement({ type: "nascimento" })).toBe(false);
  });
});
