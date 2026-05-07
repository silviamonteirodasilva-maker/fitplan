-- Add ownership and household scoping to recipes
alter table public.recipes
  add column if not exists created_by_user_id uuid references public.users(id) on delete set null;

alter table public.recipes
  add column if not exists household_id uuid references public.households(id) on delete cascade;

-- Drop the old fully-permissive read policy
drop policy if exists "recipes_public_read" on public.recipes;

-- Read: public recipes (household_id null) OR your own household's recipes
create policy "recipes_household_read"
  on public.recipes for select
  using (
    household_id is null
    or household_id = public.current_user_household_id()
  );

-- Insert: only user_submitted, must be your household
create policy "recipes_household_insert"
  on public.recipes for insert
  to authenticated
  with check (
    source = 'user_submitted'
    and household_id = public.current_user_household_id()
  );

-- Update: only user_submitted in your household
create policy "recipes_household_update"
  on public.recipes for update
  to authenticated
  using (
    source = 'user_submitted'
    and household_id = public.current_user_household_id()
  );

-- Delete: only user_submitted in your household
create policy "recipes_household_delete"
  on public.recipes for delete
  to authenticated
  using (
    source = 'user_submitted'
    and household_id = public.current_user_household_id()
  );

-- Allow authenticated users to insert ingredients (for new household-created ingredients)
create policy "ingredients_authenticated_insert"
  on public.ingredients for insert
  to authenticated
  with check (auth.uid() is not null);

-- Allow authenticated users to insert recipe_ingredients for their own recipes
create policy "recipe_ingredients_household_insert"
  on public.recipe_ingredients for insert
  to authenticated
  with check (
    recipe_id in (
      select id from public.recipes
      where source = 'user_submitted'
        and household_id = public.current_user_household_id()
    )
  );

create policy "recipe_ingredients_household_update"
  on public.recipe_ingredients for update
  to authenticated
  using (
    recipe_id in (
      select id from public.recipes
      where source = 'user_submitted'
        and household_id = public.current_user_household_id()
    )
  );

create policy "recipe_ingredients_household_delete"
  on public.recipe_ingredients for delete
  to authenticated
  using (
    recipe_id in (
      select id from public.recipes
      where source = 'user_submitted'
        and household_id = public.current_user_household_id()
    )
  );

-- Same for recipe_steps
create policy "recipe_steps_household_insert"
  on public.recipe_steps for insert
  to authenticated
  with check (
    recipe_id in (
      select id from public.recipes
      where source = 'user_submitted'
        and household_id = public.current_user_household_id()
    )
  );

create policy "recipe_steps_household_update"
  on public.recipe_steps for update
  to authenticated
  using (
    recipe_id in (
      select id from public.recipes
      where source = 'user_submitted'
        and household_id = public.current_user_household_id()
    )
  );

create policy "recipe_steps_household_delete"
  on public.recipe_steps for delete
  to authenticated
  using (
    recipe_id in (
      select id from public.recipes
      where source = 'user_submitted'
        and household_id = public.current_user_household_id()
    )
  );