
CREATE OR REPLACE FUNCTION public.current_user_household_id()
RETURNS uuid
LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT household_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1 $$;
