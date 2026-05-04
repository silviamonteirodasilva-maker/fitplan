-- 1. is_household_admin on users
ALTER TABLE public.users ADD COLUMN is_household_admin boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX one_admin_per_household ON public.users (household_id) WHERE is_household_admin = true;

-- 2. avg_yoga_minutes on user_activity_profile
ALTER TABLE public.user_activity_profile ADD COLUMN avg_yoga_minutes integer NOT NULL DEFAULT 0;

-- 3. available_appliances on user_preferences
ALTER TABLE public.user_preferences ADD COLUMN available_appliances text[];

-- 4. household_preferences table
CREATE TABLE public.household_preferences (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  preferred_shopping_day int CHECK (preferred_shopping_day BETWEEN 0 AND 6),
  cooking_sessions_per_week int NOT NULL DEFAULT 2,
  cooking_style text NOT NULL DEFAULT 'mixed' CHECK (cooking_style IN ('meal_prep','fresh','mixed')),
  max_fresh_cook_days int NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id)
);
ALTER TABLE public.household_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_prefs_select"
  ON public.household_preferences FOR SELECT
  USING (household_id = public.current_user_household_id());

CREATE POLICY "household_prefs_insert"
  ON public.household_preferences FOR INSERT TO authenticated
  WITH CHECK (household_id = public.current_user_household_id() OR auth.uid() IS NOT NULL);

CREATE POLICY "household_prefs_update"
  ON public.household_preferences FOR UPDATE
  USING (household_id = public.current_user_household_id() AND EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_household_admin = true
  ));

CREATE POLICY "household_prefs_delete"
  ON public.household_preferences FOR DELETE
  USING (household_id = public.current_user_household_id() AND EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_household_admin = true
  ));