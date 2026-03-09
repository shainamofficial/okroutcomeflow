

## Create New Organization for Existing Users

### Problem
Users with generic emails (gmail, etc.) get one auto-created organization on signup. There is no way for any user to create additional organizations afterward. The only way to join another org is via invitation.

### Solution
Add a "Create Organization" flow accessible from the org switcher in the header, plus a backend RPC to handle the creation securely.

### Database Changes

**New RPC: `create_new_organization`** (SECURITY DEFINER)
- Creates a new `organizations` row
- Creates an `organization_memberships` row for the calling user (with `is_active = false` so they stay in their current org)
- Assigns the `admin` role to the user for the new org in `user_roles`
- Returns the new org ID
- No domain is claimed (generic email users can't claim domains anyway)

```sql
CREATE OR REPLACE FUNCTION public.create_new_organization(_name text)
RETURNS uuid ...
```

### UI Changes

**`src/components/app/AppHeader.tsx`** -- Add a "Create Organization" option at the bottom of the org switcher dropdown. Clicking it opens a small dialog asking for the org name, then calls the RPC, refreshes memberships, and optionally switches to the new org.

**New component: `src/components/app/CreateOrganizationDialog.tsx`**
- Simple dialog with a name input and Create button
- Calls the `create_new_organization` RPC
- On success, invalidates auth context memberships and offers to switch to the new org

### Files to Modify
| File | Change |
|------|--------|
| Database migration | New `create_new_organization` RPC |
| `src/components/app/AppHeader.tsx` | Add "Create Organization" item in switcher dropdown |
| `src/components/app/CreateOrganizationDialog.tsx` | New dialog component |
| `src/contexts/AuthContext.tsx` | Expose `refreshMemberships` or invalidate after creation |

### Security
- The RPC uses `SECURITY DEFINER` and validates `auth.uid()` is not null
- Any authenticated user can create an organization (they become its admin)
- No domain is auto-claimed for generic email users
- The new org starts as invite-only (no domains configured)

