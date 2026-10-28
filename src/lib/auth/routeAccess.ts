import { APP_PERMISSIONS, type PermissionKey } from "@/types/permissions.type";

export function getPermissionForPath(pathname: string): PermissionKey | null {
  if (pathname === "/" || pathname === "/home") return "home";
  const permission = APP_PERMISSIONS
    .slice()
    .sort((a, b) => b.route.length - a.route.length)
    .find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`));
  return permission?.key ?? null;
}
