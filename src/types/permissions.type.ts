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
  { key: "relatorios", label: "Relatórios", route: "/geral" },
  { key: "evolucao", label: "Evolução", route: "/geral/evolucao" },
] as const;

export type PermissionKey = (typeof APP_PERMISSIONS)[number]["key"];
export type UserPermissions = Partial<Record<PermissionKey, boolean>>;

/**
 * Mapeamento desktop <-> mobile:
 * Rotas sob /dashboard/* equivalem a tela mobile de mesma permissao.
 * Ex: /dashboard/consulta -> permissao "consulta"
 *     /dashboard          -> permissao "home"
 * Assim, se o dono libera "consulta" para um membro, ele acessa
 * tanto /consulta (mobile) quanto /dashboard/consulta (desktop).
 */
export const DESKTOP_ROUTE_ALIASES: Record<string, PermissionKey> = {
  "/dashboard": "home",
  "/dashboard/consulta": "consulta",
  "/dashboard/cadastro": "cadastro",
  "/dashboard/calendario": "calendario",
  "/dashboard/reproducao": "reproducao",
  "/dashboard/vacinas": "vacinas",
  "/dashboard/nascimentos": "nascimentos",
  "/dashboard/pesagem-ce": "pesagem",
  "/dashboard/comercial": "comercial",
  "/dashboard/movimentacoes": "movimentacoes",
  "/dashboard/gerenciar": "gerenciar",
  "/dashboard/geral": "relatorios",
  "/dashboard/geral/evolucao": "evolucao",
};

export const DEFAULT_MEMBER_PERMISSIONS: UserPermissions = {
  home: true,
  consulta: true,
};

export const OWNER_PERMISSIONS: UserPermissions = Object.fromEntries(
  APP_PERMISSIONS.map(({ key }) => [key, true]),
) as UserPermissions;

export function getEffectiveRole(role?: UserRole): UserRole {
  return role === "owner" ? "owner" : "member";
}

export function getEffectivePermissions(
  role: UserRole,
  permissions?: UserPermissions,
): UserPermissions {
  return role === "owner" ? OWNER_PERMISSIONS : permissions ?? {};
}

export function canAccessPermission(
  role: UserRole,
  permissions: UserPermissions | undefined,
  key: PermissionKey,
): boolean {
  if (key === "evolucao") return role === "owner";
  if (role === "owner") return true;
  return permissions?.[key] === true;
}
