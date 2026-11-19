import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Autenticação obrigatória." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("[MemberDeletion] Supabase server credentials are not configured.");
    return NextResponse.json(
      { error: "A exclusão de membros não está configurada no servidor." },
      { status: 500 },
    );
  }

  let memberId: unknown;
  try {
    ({ memberId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (
    typeof memberId !== "string" ||
    !memberId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberId)
  ) {
    return NextResponse.json({ error: "Identificador do membro inválido." }, { status: 400 });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
  }
  if (memberId === user.id) {
    return NextResponse.json({ error: "Não é permitido excluir a própria conta." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: ownerProfile, error: ownerError } = await adminClient
    .from("user_profiles")
    .select("role, org_id, _deleted")
    .eq("id", user.id)
    .maybeSingle();

  if (ownerError) {
    console.error("[MemberDeletion] Failed to load owner profile:", ownerError.message);
    return NextResponse.json({ error: "Não foi possível validar o administrador." }, { status: 500 });
  }
  if (ownerProfile?.role !== "owner" || ownerProfile._deleted === true) {
    return NextResponse.json({ error: "Apenas o administrador pode excluir membros." }, { status: 403 });
  }
  const organizationId = ownerProfile.org_id ?? user.id;

  const { data: member, error: memberError } = await adminClient
    .from("user_profiles")
    .select("id, role, owner_id, org_id, _deleted")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    console.error("[MemberDeletion] Failed to load member profile:", memberError.message);
    return NextResponse.json({ error: "Não foi possível validar o membro." }, { status: 500 });
  }

  if (!member) {
    const { data: deletion, error: deletionError } = await adminClient
      .from("user_profile_deletions")
      .select("id")
      .eq("id", memberId)
      .eq("org_id", organizationId)
      .maybeSingle();

    if (deletionError) {
      console.error("[MemberDeletion] Failed to check deletion record:", deletionError.message);
      return NextResponse.json({ error: "Não foi possível confirmar a exclusão." }, { status: 500 });
    }
    if (deletion) return NextResponse.json({ success: true });

    return NextResponse.json({ error: "Membro não encontrado na equipe." }, { status: 404 });
  }

  if (
    member.role !== "member" ||
    member._deleted === true ||
    (member.owner_id !== user.id && member.org_id !== organizationId)
  ) {
    return NextResponse.json({ error: "Este membro não pertence à sua equipe." }, { status: 403 });
  }

  const { error: authDeleteError } =
    await adminClient.auth.admin.deleteUser(memberId);
  if (authDeleteError && authDeleteError.status !== 404) {
    console.error("[MemberDeletion] Failed to delete Auth user:", authDeleteError.message);
    return NextResponse.json(
      { error: "Não foi possível excluir a conta de autenticação do membro." },
      { status: 502 },
    );
  }

  const { data: deleted, error: profileDeleteError } = await adminClient.rpc(
    "delete_member_profile",
    {
      p_member_id: memberId,
      p_owner_id: user.id,
      p_org_id: organizationId,
    },
  );

  if (profileDeleteError) {
    console.error("[MemberDeletion] Failed to delete member profile:", profileDeleteError.message);
    return NextResponse.json(
      { error: "A conta foi excluída, mas não foi possível concluir a remoção do perfil. Tente novamente." },
      { status: 500 },
    );
  }
  if (!deleted) {
    return NextResponse.json(
      { error: "O membro deixou de pertencer à equipe antes da exclusão." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}
