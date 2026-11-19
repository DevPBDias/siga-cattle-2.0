BEGIN;

UPDATE public.user_profiles AS owner
SET org_id = owner.id::uuid,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
WHERE owner.role = 'owner'
  AND owner.org_id IS NULL;

UPDATE public.user_profiles AS member
SET org_id = owner.org_id,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
FROM public.user_profiles AS owner
WHERE member.role = 'member'
  AND member.org_id IS NULL
  AND member.owner_id::text = owner.id::text
  AND owner.role = 'owner'
  AND owner.org_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    profile.org_id,
    CASE WHEN profile.role = 'owner' THEN profile.id::uuid END
  )
  FROM public.user_profiles AS profile
  WHERE profile.id::text = auth.uid()::text
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_org_id() TO authenticated;

COMMIT;
