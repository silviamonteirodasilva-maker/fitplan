DROP POLICY IF EXISTS households_insert ON public.households;
CREATE POLICY households_insert ON public.households FOR INSERT TO authenticated WITH CHECK (true);