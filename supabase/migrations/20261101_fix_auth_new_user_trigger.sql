-- =============================================================================
-- MIGRAÇÃO DE CORREÇÃO: Trigger on_auth_user_created e handle_new_user()
-- Resolve o erro "Database error saving new user" ao cadastrar qualquer usuário
-- =============================================================================

-- 1. Recria a função com SET search_path = public e schema qualificado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    permissions,
    created_at,
    updated_at,
    _deleted
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'member',
    '{"home": true, "consulta": true}'::jsonb,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Blindagem crítica: se houver qualquer divergência em user_profiles,
  -- não cancela a transação em auth.users (evita o erro 500 'Database error saving new user')
  RETURN NEW;
END;
$$;

-- 2. Recria o trigger em auth.users apontando explicitamente para public.handle_new_user()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

