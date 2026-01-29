

# Fix Generic Email Domain Signup Flow

## Problem Identified

Users signing up with generic email domains (gmail.com, hotmail.com, etc.) are incorrectly getting:
- `status: pending` (should be `active`)
- `role: contributor` (should be `admin`)
- `organization_id: NULL` (should have a new org created)

The `handle_new_user()` function was updated but isn't working correctly. The issue is that users with generic domains should:
1. Get a NEW organization created for them
2. Be set as `active` admin
3. NOT have any domain registered (invite-only org)

## Root Cause

After investigation, the issue appears to be with how the function handles the domain lookup. When `gmail.com` is not found in `organization_domains`, it should enter the ELSE branch and create a new org. However, some users are getting the IF branch behavior (pending/contributor) with NULL org.

## Solution

### 1. Fix the `handle_new_user()` Function

Update the function to be more robust and explicitly handle all cases:

**Key changes:**
- Add explicit NULL check before organization insert
- Ensure the function never leaves a user without an organization
- Add better error handling

### 2. Clean Up Existing Data

Fix users who were incorrectly created with `organization_id: NULL`:

| Email | Current State | Fix |
|-------|---------------|-----|
| authentickteam@gmail.com | pending, contributor, no org | Create org, set active, set admin |
| jozzire.ps4@gmail.com | active, admin, no org | Create org |
| shainam.iit@gmail.com | active, admin, no org | Create org |

### 3. Update Frontend to Handle Edge Cases

The app should gracefully handle users who might have `organization_id: NULL` and prompt them to contact support or retry signup.

## Database Migration

**Part 1: Robust `handle_new_user()` function**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  email_domain TEXT;
  existing_org_id UUID;
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Get email and convert to lowercase
  user_email := lower(trim(NEW.email));
  
  -- Extract domain from email
  email_domain := lower(trim(split_part(user_email, '@', 2)));
  
  -- Validate email has a domain
  IF email_domain IS NULL OR email_domain = '' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  
  -- Get user name from metadata or default to empty string
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  
  -- Check if domain exists in organization_domains (only for non-generic domains)
  SELECT organization_id INTO existing_org_id
  FROM public.organization_domains
  WHERE domain = email_domain
  LIMIT 1;
  
  IF existing_org_id IS NOT NULL THEN
    -- Domain exists: create profile as contributor with pending status
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (NEW.id, existing_org_id, user_email, user_name, 'pending')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add contributor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'contributor')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Domain does not exist: create new organization
    INSERT INTO public.organizations (name)
    VALUES ('New Organization')
    RETURNING id INTO new_org_id;
    
    -- Only create organization domain if NOT a generic domain
    IF NOT is_generic_domain(email_domain) THEN
      INSERT INTO public.organization_domains (organization_id, domain, verified)
      VALUES (new_org_id, email_domain, true);
    END IF;
    
    -- Create profile as admin with active status
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (NEW.id, new_org_id, user_email, user_name, 'active')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
```

**Part 2: Fix existing broken users**

For each user with `organization_id: NULL`, we need to:
1. Create a new organization
2. Update their profile with the org ID and correct status
3. Update their role to admin

```sql
-- Fix authentickteam@gmail.com
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  INSERT INTO organizations (name) VALUES ('New Organization') RETURNING id INTO v_org_id;
  
  UPDATE users_profile 
  SET organization_id = v_org_id, status = 'active' 
  WHERE email = 'authentickteam@gmail.com';
  
  UPDATE user_roles 
  SET role = 'admin' 
  WHERE user_id = (SELECT id FROM users_profile WHERE email = 'authentickteam@gmail.com');
END $$;

-- Repeat for other broken users
```

## Files to Modify

| File | Changes |
|------|---------|
| New migration | Fix `handle_new_user()` function and repair broken user data |

## Testing After Fix

1. Sign up with a new gmail.com account
2. Verify the user gets:
   - `status: active`
   - `role: admin`
   - A new organization created
   - No domain registered (invite-only org)
3. Verify Organization Settings shows "This organization is invite-only"

