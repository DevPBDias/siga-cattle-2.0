export type UserRole = "owner" | "member";

export const APP_PERMISSIONS = [
  { key: "home", label: "Início", route: "/home" },
  { key: "cadastro", label: "Cadastro", route: "/cadastro" },
  { key: "consulta", label: "Consulta", route: "/consulta" },
  { key: "calendario", label: "Calendário", route: "/calendario" },
  { key: "reproducao", label: "Reprodução", route: "/reproducao" },
  { key: "vacinas", label: "Vacinas", route: "/vacinas" },
  { key: "nascimentos", label: "Nascimentos", route: "/nascimentos" },
  { key: "pesagem", label: "Pesagem", route: "/pesagem-ce" },
  { key: "comercial", label: "Comercial", route: "/comercial" },
  { key: "movimentacoes", label: "Movimentações", route: "/movimentacoes" },
  { key: "gerenciar", label: "Gerenciamento", route: "/gerenciar" },
  { key: "relatorios", label: "Relatórios", route: "/geral/relatorios" },
] as const;

export type PermissionKey = (typeof APP_PERMISSIONS)[number]["key"];
export type UserPermissions = Partial<Record<PermissionKey, boolean>>;

export const DEFAULT_MEMBER_PERMISSIONS: UserPermissions = {
  consulta: true,
};

export const OWNER_PERMISSIONS: UserPermissions = Object.fromEntries(
  APP_PERMISSIONS.map(({ key }) => [key, true]),
) as UserPermissions;

export function getEffectiveRole(role?: UserRole): UserRole {
  return role === "member" ? "member" : "owner";
}

export function canAccessPermission(
  role: UserRole,
  permissions: UserPermissions | undefined,
  key: PermissionKey,
): boolean {
  if (role === "owner") return true;
  return permissions?.[key] === true;
}
