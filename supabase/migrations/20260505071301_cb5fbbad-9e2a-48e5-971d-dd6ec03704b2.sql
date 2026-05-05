
-- Pause / holiday mode
DO $$ BEGIN
  CREATE TYPE pause_reason AS ENUM ('sickness', 'holiday', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.plan_pauses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reason pause_reason not null,
  paused_at date not null default current_date,
  resumed_at date,
  expected_return_date date,
  days_paused int generated always as (
    case when resumed_at is not null then (resumed_at - paused_at) else null end
  ) stored,
  notes text
);
ALTER TABLE public.plan_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pauses_own" ON public.plan_pauses FOR ALL
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS plan_pauses_user_id_idx ON public.plan_pauses(user_id);

-- Meal slot configuration per household
CREATE TABLE IF NOT EXISTS public.household_meal_config (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  show_breakfast boolean not null default true,
  show_snack_am boolean not null default false,
  show_lunch boolean not null default true,
  show_snack_pm boolean not null default false,
  show_dinner boolean not null default true,
  show_coffee boolean not null default false,
  show_addon boolean not null default false,
  week_start_day int not null default 1 check (week_start_day between 0 and 6),
  updated_at timestamptz not null default now(),
  unique (household_id)
);
ALTER TABLE public.household_meal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_config_select" ON public.household_meal_config FOR SELECT
USING (household_id = public.current_user_household_id());

CREATE POLICY "meal_config_insert" ON public.household_meal_config FOR INSERT TO authenticated
WITH CHECK (household_id = public.current_user_household_id() OR auth.uid() IS NOT NULL);

CREATE POLICY "meal_config_update" ON public.household_meal_config FOR UPDATE
USING (household_id = public.current_user_household_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_household_admin = true));

CREATE POLICY "meal_config_delete" ON public.household_meal_config FOR DELETE
USING (household_id = public.current_user_household_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_household_admin = true));

-- Slot state + notes
ALTER TABLE public.weekly_plan_slots
  ADD COLUMN IF NOT EXISTS slot_state text NOT NULL DEFAULT 'planned'
    CHECK (slot_state IN ('planned', 'eating_out', 'skipped'));

ALTER TABLE public.weekly_plan_slots
  ADD COLUMN IF NOT EXISTS notes text;

-- Default plan mode preference
ALTER TABLE public.household_preferences
  ADD COLUMN IF NOT EXISTS default_plan_mode text;
