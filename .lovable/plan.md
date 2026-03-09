

## Multi-Organization Membership

### The Problem
Currently, each user has a single `organization_id` in `users_profile`. The entire app -- RLS policies, hooks, queries -- assumes one user = one org. Generic email users (gmail, etc.) auto-create a new org on signup with no way to join additional ones.

### Architecture Changes Required

#### 1. New Table: `organization_memberships`
A many-to-many join between users and organizations, with an `is_active` flag to track which org the user is currently working in.

```sql
CREATE TABLE public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
```

#### 2. Per-Organization Roles
Currently `user_roles` has `(user_id, role)`. A user might be admin in Org A but contributor in Org B. Add `organization_id` to `user_roles`:

```sql
ALTER TABLE user_roles ADD COLUMN organization_id uuid REFERENCES organizations(id);
```

Update the unique constraint from `(user_id, role)` to `(user_id, role, organization_id)`.

#### 3. Update `get_user_org_id()` Function
Change it to return the org where `is_active = true` from `organization_memberships` instead of reading `users_profile.organization_id`.

#### 4. Update `has_role()` Function
Scope role checks to the active organization.

#### 5. Update `handle_new_user()` Trigger
On signup, create a membership row (with `is_active = true`) in addition to the profile. Keep `users_profile.organization_id` as a denormalized "active org" for backward compatibility during migration.

#### 6. Migration of Existing Data
Insert rows into `organization_memberships` for every existing `users_profile` row, setting `is_active = true`. Backfill `organization_id` on `user_roles` from the user's current org.

#### 7. New RPC: `switch_organization`
A `SECURITY DEFINER` function that:
- Validates the user has a membership in the target org
- Sets `is_active = false` on current membership
- Sets `is_active = true` on the target membership
- Updates `users_profile.organization_id` (denormalized)

#### 8. New Feature: Join Organization via Invitation
Update invitation flow so that if a user already exists, accepting an invitation creates a new `organization_memberships` row rather than failing. The `accept_invitation` RPC needs to handle existing users.

#### 9. Organization Switcher UI
- Add a dropdown in `AppHeader` (next to the org logo/name) showing all orgs the user belongs to
- Clicking an org calls `switch_organization` RPC
- On switch, refresh profile/roles and invalidate all React Query caches

### Files to Modify

| Area | Files |
|------|-------|
| Database | New migration: `organization_memberships` table, update `user_roles`, update `get_user_org_id()`, `has_role()`, `handle_new_user()`, new `switch_organization` RPC |
| Auth Context | `src/contexts/AuthContext.tsx` -- fetch memberships, expose `switchOrganization` |
| Header UI | `src/components/app/AppHeader.tsx` -- org switcher dropdown |
| Invitation Flow | `src/hooks/useInvitations.ts`, `accept_invitation` RPC -- handle existing users joining new orgs |
| Signup Invite | `src/pages/SignupInvite.tsx` -- allow existing users to accept invites (redirect to login instead of signup if account exists) |

### No Changes Needed
- All hooks that use `profile.organization_id` continue to work because the denormalized field on `users_profile` stays in sync via the `switch_organization` RPC.
- All RLS policies that call `get_user_org_id()` continue to work because the function returns the active org from `organization_memberships`.

### Execution Order
1. Create `organization_memberships` table with RLS
2. Backfill existing data
3. Add `organization_id` to `user_roles` and backfill
4. Update DB functions (`get_user_org_id`, `has_role`, `handle_new_user`)
5. Create `switch_organization` RPC
6. Update `accept_invitation` RPC for existing users
7. Add org switcher to `AppHeader`
8. Update `AuthContext` with `switchOrganization` method

