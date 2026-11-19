BEGIN;

DROP POLICY IF EXISTS user_profiles_update_org
  ON public.user_profiles;

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

COMMIT;
