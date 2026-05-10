-- Tighten INSERT policies on household_preferences and household_meal_config
DROP POLICY IF EXISTS household_prefs_insert ON public.household_preferences;
CREATE POLICY household_prefs_insert ON public.household_preferences
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.current_user_household_id());

DROP POLICY IF EXISTS meal_config_insert ON public.household_meal_config;
CREATE POLICY meal_config_insert ON public.household_meal_config
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.current_user_household_id());

-- Prevent self-escalation: users can update their own row but not is_household_admin or household_id
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    AND household_id = public.current_user_household_id()
    AND is_household_admin = (SELECT u.is_household_admin FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
  );