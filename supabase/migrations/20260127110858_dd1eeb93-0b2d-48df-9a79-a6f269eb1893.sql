-- Fix: Allow organization creation during signup
-- The user is authenticated at this point but the RLS check needs to be permissive for INSERT
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);