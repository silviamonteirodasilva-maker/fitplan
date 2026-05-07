-- households table was created outside migrations (Lovable initial schema).
-- Explicitly grant INSERT to authenticated and re-apply the insert policy so
-- the 403 on household creation is resolved even if earlier migrations were
-- applied before the table existed.

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.households TO authenticated;

DROP POLICY IF EXISTS households_insert ON public.households;
CREATE POLICY households_insert ON public.households
  FOR INSERT TO authenticated WITH CHECK (true);
