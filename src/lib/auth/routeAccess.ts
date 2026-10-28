import { APP_PERMISSIONS, DESKTOP_ROUTE_ALIASES, type PermissionKey } from "@/types/permissions.type";

export function getPermissionForPath(pathname: string): PermissionKey | null {
  if (pathname === "/" || pathname === "/home") return "home";

  // Verifica aliases desktop (rotas /dashboard/*) do mais longo para o mais curto
  const sortedAliases = Object.keys(DESKTOP_ROUTE_ALIASES).sort(
    (a, b) => b.length - a.length,
  );
  for (const alias of sortedAliases) {
    if (pathname === alias || pathname.startsWith(`${alias}/`)) {
      return DESKTOP_ROUTE_ALIASES[alias];
    }
  }

  // Fallback: lookup padrão nas rotas mobile
  const permission = APP_PERMISSIONS
    .slice()
    .sort((a, b) => b.route.length - a.route.length)
    .find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`));
  return permission?.key ?? null;
}
