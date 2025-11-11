-- =====================================================
-- RLS POLICIES MIGRATION FOR RESTAURANT POS SYSTEM
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users in tenant" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users in tenant" ON users;
DROP POLICY IF EXISTS "Admins can update users in tenant" ON users;
DROP POLICY IF EXISTS "Admins can delete users in tenant" ON users;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Admins can read all users in their tenant
CREATE POLICY "Admins can read all users in tenant"
ON users
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Users can update their own data (limited fields)
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can insert users in their tenant
CREATE POLICY "Admins can insert users in tenant"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can update users in their tenant
CREATE POLICY "Admins can update users in tenant"
ON users
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can delete users in their tenant (except themselves)
CREATE POLICY "Admins can delete users in tenant"
ON users
FOR DELETE
TO authenticated
USING (
  id != auth.uid() AND
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the policies were created successfully
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
