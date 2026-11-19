import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MEMBER_PERMISSIONS } from "@/types/permissions.type";

const EMPTY_PROFILE_FIELDS = {
  residential_address: "",
  cpf: "",
  phone: "",
  farm_state_registration: "",
  farm_address: "",
  farm_city: "",
  farm_car_number: "",
  farm_sigcar: "",
  farm_nirb: "",
  farm_ccir: "",
};

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Autenticação obrigatória." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("[MemberCreation] Supabase server credentials are not configured.");
    return NextResponse.json(
      { error: "A criação de usuários não está configurada no servidor." },
      { status: 500 },
    );
  }

  let input: { fullName?: unknown; email?: unknown; password?: unknown };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
    return NextResponse.json(
      { error: "Nome, e-mail válido e senha de pelo menos 6 caracteres são obrigatórios." },
      { status: 400 },
    );
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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: ownerProfile, error: ownerError } = await adminClient
    .from("user_profiles")
    .select("id, role, org_id, farm_name, _deleted")
    .eq("id", user.id)
    .maybeSingle();

  if (ownerError) {
    console.error("[MemberCreation] Failed to load owner profile:", ownerError.message);
    return NextResponse.json(
      { error: "Não foi possível validar o administrador." },
      { status: 500 },
    );
  }
  if (ownerProfile?.role !== "owner" || ownerProfile._deleted === true) {
    return NextResponse.json(
      { error: "Apenas o administrador pode criar usuários." },
      { status: 403 },
    );
  }

  const organizationId = ownerProfile.org_id ?? user.id;
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (authError || !authData.user) {
    if (authError?.code === "user_already_exists") {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado no sistema." },
        { status: 409 },
      );
    }
    console.error("[MemberCreation] Failed to create Auth user:", authError?.message);
    return NextResponse.json(
      { error: "Não foi possível criar a conta de autenticação do usuário." },
      { status: 502 },
    );
  }

  const now = Date.now();
  const profile = {
    id: authData.user.id,
    full_name: fullName,
    email,
    role: "member",
    permissions: DEFAULT_MEMBER_PERMISSIONS,
    owner_id: user.id,
    org_id: organizationId,
    farm_name: ownerProfile.farm_name ?? "",
    created_at: now,
    updated_at: now,
    _deleted: false,
    ...EMPTY_PROFILE_FIELDS,
  };
  const { data: savedProfile, error: profileError } = await adminClient
    .from("user_profiles")
    .upsert(profile)
    .select()
    .single();

  if (profileError || !savedProfile) {
    console.error("[MemberCreation] Failed to save member profile:", profileError?.message);
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(authData.user.id);
    if (cleanupError) {
      console.error("[MemberCreation] Failed to clean up Auth user:", cleanupError.message);
    }
    return NextResponse.json(
      { error: "A conta foi criada, mas não foi possível salvar o perfil do usuário." },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: savedProfile }, { status: 201 });
}
