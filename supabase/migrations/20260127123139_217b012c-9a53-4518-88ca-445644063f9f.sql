-- Fix organizations INSERT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: The policy is now PERMISSIVE by default (no USING AS RESTRICTIVE clause)