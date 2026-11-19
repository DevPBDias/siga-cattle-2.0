BEGIN;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS org_id uuid;
CREATE INDEX IF NOT EXISTS animals_org_id_idx
  ON public.animals (org_id);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_profiles_org_id_idx
  ON public.user_profiles (org_id);

UPDATE public.user_profiles AS profile
SET org_id = animal_org.org_id,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
FROM (
  SELECT DISTINCT org_id
  FROM public.animals
  WHERE NULLIF(btrim(org_id::text), '') IS NOT NULL
) AS animal_org
WHERE profile.role = 'owner'
  AND profile.org_id IS NULL
  AND profile.id::text = animal_org.org_id::text
  AND (
    SELECT count(DISTINCT NULLIF(btrim(org_id::text), ''))
    FROM public.animals
  ) > 1;

WITH single_animal_org AS (
  SELECT min(NULLIF(btrim(org_id::text), ''))::uuid AS org_id
  FROM public.animals
  WHERE NULLIF(btrim(org_id::text), '') IS NOT NULL
  HAVING count(DISTINCT NULLIF(btrim(org_id::text), '')) = 1
)
UPDATE public.user_profiles AS profile
SET org_id = single_animal_org.org_id,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
FROM single_animal_org
WHERE profile.role = 'owner'
  AND profile.org_id IS NULL;

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
  SELECT profile.org_id
  FROM public.user_profiles AS profile
  WHERE profile.id::text = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_org_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles AS profile
    WHERE profile.id::text = auth.uid()::text
      AND profile.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.get_current_user_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_org_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_org_owner() TO authenticated;

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.user_profiles',
      existing_policy.policyname
    );
  END LOOP;
END
$$;

CREATE POLICY user_profiles_select_org
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id::text = auth.uid()::text
    OR (
      org_id IS NOT NULL
      AND org_id = public.get_current_user_org_id()
    )
  );

CREATE POLICY user_profiles_insert_org
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      id::text = auth.uid()::text
      AND role = 'member'
      AND org_id IS NULL
    )
    OR (
      id::text = auth.uid()::text
      AND role = 'owner'
      AND owner_id IS NULL
      AND org_id = auth.uid()
    )
    OR (
      public.is_current_user_org_owner()
      AND org_id = public.get_current_user_org_id()
    )
  );

CREATE POLICY user_profiles_update_org
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id::text = auth.uid()::text
    OR (
      public.is_current_user_org_owner()
      AND (
        (
          role = 'member'
          AND (
            org_id = public.get_current_user_org_id()
            OR org_id IS NULL
          )
        )
        OR (
          role = 'owner'
          AND owner_id::text = auth.uid()::text
          AND org_id = public.get_current_user_org_id()
        )
      )
    )
  )
  WITH CHECK (
    (
      id::text = auth.uid()::text
      AND role = 'member'
      AND NOT public.is_current_user_org_owner()
      AND org_id IS NOT DISTINCT FROM public.get_current_user_org_id()
    )
    OR (
      id::text = auth.uid()::text
      AND role = 'owner'
      AND (
        (
          public.is_current_user_org_owner()
          AND org_id IS NOT DISTINCT FROM public.get_current_user_org_id()
        )
        OR (
          NOT public.is_current_user_org_owner()
          AND public.get_current_user_org_id() IS NULL
          AND owner_id IS NULL
          AND org_id = auth.uid()
        )
      )
    )
    OR (
      public.is_current_user_org_owner()
      AND (
        (
          role = 'member'
          AND (
            org_id = public.get_current_user_org_id()
            OR (
              org_id IS NULL
              AND owner_id::text = ''
            )
          )
        )
        OR (
          role = 'owner'
          AND owner_id::text = auth.uid()::text
          AND org_id = public.get_current_user_org_id()
        )
      )
    )
  );

CREATE POLICY user_profiles_delete_org
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    public.is_current_user_org_owner()
    AND role = 'member'
    AND org_id = public.get_current_user_org_id()
  );

COMMIT;
