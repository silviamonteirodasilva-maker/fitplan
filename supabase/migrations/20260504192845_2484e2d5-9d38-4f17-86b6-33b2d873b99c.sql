
-- Allow signed-in users to create households
CREATE POLICY households_insert ON public.households
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow updating own household by primary user
CREATE POLICY households_update ON public.households
  FOR UPDATE TO authenticated
  USING (id = current_user_household_id());

-- Helper to check whether the auth user already has a primary user row
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1 $$;

-- Allow the user to insert their own primary user row OR insert other rows into their household
CREATE POLICY users_insert_self_or_household ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = auth.uid()
    OR household_id = current_user_household_id()
  );

-- Allow inserting biometrics for any user in the same household
CREATE POLICY biometrics_household_insert ON public.user_biometrics
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE household_id = current_user_household_id())
  );

-- Activity profile insert for self (covered by existing ALL policy via auth_user_id), but explicit:
-- (the existing 'activity_profile_own' ALL policy already covers self-inserts)

-- Allow inserting meal_macro_distribution for own metabolic profile (existing ALL covers it)

-- Nothing else needed; existing ALL policies cover the rest.
