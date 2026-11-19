/*
  Admin authorization for browser-based management pages.

  Admin role must be assigned through trusted server-side tooling in
  auth.users.raw_app_meta_data. Never accept a role from user-editable
  user_metadata or from the browser.
*/

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['hotel_info', 'rooms', 'bookings', 'team_members', 'admin_users']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can manage ' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') WITH CHECK ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
      'Admins can manage ' || table_name,
      table_name
    );
  END LOOP;
END
$$;
