const LEGACY_PARTNERSHIP_ALIASES: Record<string, string> = {
  alex: "Alex",
  fat: "Fátima",
  fátima: "Fátima",
  fatima: "Fátima",
  jac: "Jacir",
  jacir: "Jacir",
  ric: "Ricardo",
  ricardo: "Ricardo",
};

/**
 * Normalizes a legacy partnership token (e.g. "Fat" -> "Fátima") or returns it trimmed.
 */
export function normalizePartnerToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed || trimmed === "-") return "";
  return LEGACY_PARTNERSHIP_ALIASES[trimmed.toLocaleLowerCase("pt-BR")] ?? trimmed;
}

/**
 * Parses a stored `animal.partnership` string (e.g. "Alex/Fat/Ric" or "Alex/João")
 * into canonical partner names.
 */
export function parsePartnershipNames(
  rawPartnership: string | null | undefined,
  availablePartnerNames?: string[],
): string[] {
  if (!rawPartnership) return [];

  const tokens = rawPartnership
    .split("/")
    .map(normalizePartnerToken)
    .filter(Boolean);

  if (!availablePartnerNames || availablePartnerNames.length === 0) {
    return Array.from(new Set(tokens));
  }

  const byLower = new Map(
    availablePartnerNames.map((name) => [name.toLocaleLowerCase("pt-BR"), name]),
  );

  const resolved = tokens.map(
    (token) => byLower.get(token.toLocaleLowerCase("pt-BR")) ?? token,
  );
  return Array.from(new Set(resolved));
}

/**
 * Formats selected partner names into the stored `animal.partnership` string.
 */
export function formatPartnershipNames(names: string[]): string {
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .join("/");
}
