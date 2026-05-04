CREATE POLICY "users_claim_invite"
  ON public.users FOR UPDATE TO authenticated
  USING (auth_user_id IS NULL AND lower(email) = lower(auth.jwt()->>'email'))
  WITH CHECK (auth_user_id = auth.uid() AND lower(email) = lower(auth.jwt()->>'email'));