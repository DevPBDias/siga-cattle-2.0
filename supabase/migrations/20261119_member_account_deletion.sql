BEGIN;

CREATE TABLE IF NOT EXISTS public.user_profile_deletions (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL,
  org_id uuid NOT NULL,
  deleted_at bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS user_profile_deletions_org_deleted_at_idx
  ON public.user_profile_deletions (org_id, deleted_at, id);

ALTER TABLE public.user_profile_deletions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profile_deletions_select_org
  ON public.user_profile_deletions;
CREATE POLICY user_profile_deletions_select_org
  ON public.user_profile_deletions
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_current_user_org_id()
    OR (
      public.get_current_user_org_id() IS NULL
      AND owner_id = auth.uid()
    )
  );

REVOKE ALL ON public.user_profile_deletions FROM anon, authenticated;
GRANT SELECT ON public.user_profile_deletions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.user_profile_deletions TO service_role;

CREATE OR REPLACE FUNCTION public.delete_member_profile(
  p_member_id text,
  p_owner_id uuid,
  p_org_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  member_org_id uuid;
BEGIN
  SELECT profile.org_id
  INTO member_org_id
  FROM public.user_profiles AS profile
  WHERE profile.id::text = p_member_id
    AND profile.role = 'member'
    AND COALESCE(profile._deleted, false) = false
    AND (
      profile.owner_id::text = p_owner_id::text
      OR profile.org_id = p_org_id
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_profile_deletions (
      id,
      owner_id,
      org_id,
      deleted_at
    )
    VALUES (
      p_member_id,
      p_owner_id,
      p_org_id,
      (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN EXISTS (
      SELECT 1
      FROM public.user_profile_deletions AS deletion
      WHERE deletion.id = p_member_id
        AND deletion.org_id = p_org_id
    );
  END IF;

  INSERT INTO public.user_profile_deletions (
    id,
    owner_id,
    org_id,
    deleted_at
  )
  VALUES (
    p_member_id,
    p_owner_id,
    COALESCE(member_org_id, p_org_id),
    (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
  )
  ON CONFLICT (id) DO UPDATE
  SET owner_id = EXCLUDED.owner_id,
      org_id = EXCLUDED.org_id,
      deleted_at = EXCLUDED.deleted_at;

  DELETE FROM public.user_profiles AS profile
  WHERE profile.id::text = p_member_id
    AND profile.role = 'member'
    AND COALESCE(profile._deleted, false) = false
    AND (
      profile.owner_id::text = p_owner_id::text
      OR profile.org_id = p_org_id
    );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_member_profile(text, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_member_profile(text, uuid, uuid)
  TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_profile_deletions'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.user_profile_deletions;
  END IF;
END
$$;

COMMIT;
