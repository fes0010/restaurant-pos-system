# Quick Fix Instructions for Login Redirect Issue

## Problem
After successful login, you're being redirected back to the login page.

## Root Cause
The RLS (Row Level Security) policies on the `users` table are not allowing users to read their own data after authentication.

## Solution (2 minutes)

### Step 1: Apply RLS Policies
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kqjcnpxyrltdovhhlaug
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the entire contents of `supabase-rls-migration.sql` file
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned" message

### Step 2: Verify
After running the SQL, the verification query at the bottom will show you all the policies created. You should see 6 policies:
- Admins can delete users in tenant
- Admins can insert users in tenant
- Admins can read all users in tenant
- Admins can update users in tenant
- Users can read own data
- Users can update own data

### Step 3: Test Login
1. Clear your browser cache or open an incognito window
2. Go to your application URL
3. Log in with your credentials
4. You should now be redirected to the dashboard successfully

## What These Policies Do

- **Users can read own data**: Allows any authenticated user to read their own user record
- **Admins can read all users in tenant**: Allows admins to see all users in their organization
- **Users can update own data**: Allows users to update their own profile
- **Admins can insert users in tenant**: Allows admins to create new users
- **Admins can update users in tenant**: Allows admins to modify user accounts
- **Admins can delete users in tenant**: Allows admins to delete users (except themselves)

## Still Having Issues?

Check the browser console (F12) for error messages and look for:
- RLS policy errors
- Authentication errors
- Network errors

The console logs will show exactly what's failing in the `AuthContext`.
