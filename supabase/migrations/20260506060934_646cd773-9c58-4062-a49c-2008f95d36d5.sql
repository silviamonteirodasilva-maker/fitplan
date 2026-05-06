-- Fix recursive/restrictive users SELECT: allow user to read their own row directly,
-- and harden the helper function with SECURITY DEFINER so household lookups don't recurse through RLS.

CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_user_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ SELECT household_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1 $function$;