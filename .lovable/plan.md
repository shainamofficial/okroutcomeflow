
# Platform Owner (Master Admin) Access System

This plan implements a platform-level master admin system for RoadmapOKR, allowing the SaaS owner to view and manage all organizations, users, teams, and data across the entire platform.

## Overview

The system introduces a `platform_admins` table to identify super users who can bypass organization-level scoping. It includes a new `/platform` route with views for managing organizations, users, and other platform admins.

## 1. Database Changes

### New Table: `platform_admins`

```text
platform_admins
+------------+---------------------------+-------------------------------------+
| Column     | Type                      | Constraints                         |
+------------+---------------------------+-------------------------------------+
| id         | uuid                      | primary key, default gen_random_uuid|
| email      | text                      | not null, unique, lowercase         |
| created_at | timestamptz               | default now()                       |
+------------+---------------------------+-------------------------------------+
```

### Initial Seed

Insert `shainam.iit@gmail.com` as the first platform admin using `INSERT ... ON CONFLICT DO NOTHING`.

### Helper Function

Create a `SECURITY DEFINER` function `is_platform_admin(_user_id uuid)` that:
- Looks up the user's email from `auth.users`
- Checks if that email exists in `platform_admins`
- Returns boolean

### RLS Policies for `platform_admins`

| Operation | Policy |
|-----------|--------|
| SELECT | Only platform admins can view |
| INSERT | Only platform admins can add |
| DELETE | Only platform admins can remove (with last-admin check) |
| UPDATE | Not allowed |

### RLS Policy Updates for Existing Tables

Update SELECT policies on all organization-scoped tables to allow platform admins to bypass org filtering:

**Tables to update:**
- `organizations`
- `organization_domains`
- `users_profile`
- `user_roles`
- `teams`
- `team_members`
- `objectives`
- `key_results`
- `kr_metric_config`
- `kr_metric_values`
- `kr_review_cadence`
- `kr_review_sessions`
- `kr_review_participants`
- `initiatives`
- `initiative_kr_links`
- `tasks`
- `updates`
- `update_mentions`
- `update_reactions`
- `notifications`
- `user_invitations`

Pattern for updated SELECT policies:
```sql
USING (
  is_platform_admin(auth.uid()) OR 
  (original_org_scoped_condition)
)
```

Similar updates for UPDATE and DELETE policies where platform admins need write access.

## 2. Frontend Changes

### New Context: `PlatformAdminContext`

Create a context that:
- Checks if current user is a platform admin on auth
- Provides `isPlatformAdmin` boolean
- Fetches platform admin status via RPC or direct query

### New Route Guard: `PlatformAdminRoute`

A route guard component that:
- Shows loading state while checking
- Shows "No access" message for non-platform-admins
- Renders children for platform admins

### New Hooks

**`usePlatformAdmins`**
- Fetches list of platform admins
- Mutations for add/remove platform admin
- Includes last-admin protection

**`usePlatformOrganizations`**
- Fetches all organizations with aggregated counts (users, teams, objectives)
- Delete organization mutation (with cascade warning)

**`usePlatformUsers`**
- Fetches all users across all organizations
- Includes organization name, role, status
- Mutations for status changes, role changes, delete

### New Page: `/platform` (Platform.tsx)

Tab-based interface with four sections:

**Tab 1: Organizations**
- Table: name, created_at, user count, team count, objective count
- Actions: View details (opens drawer), Delete (with confirmation)

**Tab 2: Organization Detail (Drawer)**
- Profile section
- Domains list
- Users list
- Teams list
- Objectives and KRs summary

**Tab 3: Global Users**
- Table: name, email, organization, role, status, created_at
- Actions: Activate, Deactivate, Change role, Reset to pending, Delete

**Tab 4: Platform Admins**
- List of platform admin emails
- Add new platform admin (email input)
- Remove platform admin (with last-admin protection)

### Sidebar Update

Add "Platform" navigation item that:
- Only appears for platform admins
- Uses a Shield or Crown icon
- Links to `/platform`

### App Router Update

Add route `/platform` with `PlatformAdminRoute` guard.

## 3. File Structure

```text
src/
├── contexts/
│   └── PlatformAdminContext.tsx      (new)
├── components/
│   └── auth/
│       └── PlatformAdminRoute.tsx    (new)
│   └── platform/
│       ├── OrganizationsTable.tsx    (new)
│       ├── OrganizationDetailDrawer.tsx (new)
│       ├── GlobalUsersTable.tsx      (new)
│       └── PlatformAdminManager.tsx  (new)
├── hooks/
│   ├── usePlatformAdmins.ts          (new)
│   ├── usePlatformOrganizations.ts   (new)
│   └── usePlatformUsers.ts           (new)
└── pages/
    └── Platform.tsx                   (new)
```

## 4. Implementation Order

1. **Database migration** - Create `platform_admins` table, seed data, helper function, and RLS policies
2. **Database migration (Part 2)** - Update existing table RLS policies to allow platform admin bypass
3. **PlatformAdminContext** - Context for checking platform admin status
4. **PlatformAdminRoute** - Route guard component
5. **usePlatformAdmins hook** - CRUD operations for platform admins
6. **usePlatformOrganizations hook** - Organization listing and management
7. **usePlatformUsers hook** - Global user management
8. **Platform page components** - Tables, drawers, forms
9. **Platform.tsx page** - Main page assembly
10. **Sidebar and routing updates** - Navigation and route registration

## Technical Notes

### Security Considerations

- The `is_platform_admin` function uses `SECURITY DEFINER` to access `auth.users` safely
- Platform admin check happens server-side in RLS policies
- Client-side `isPlatformAdmin` state is for UI purposes only - actual access is enforced by RLS

### Last Admin Protection

The system prevents removing the last platform admin by:
1. Counting remaining platform admins before delete
2. Blocking the operation if count would reach zero

### Organization Deletion

Deleting an organization will cascade delete all related data. The UI will show a confirmation dialog listing what will be deleted.

### Developer Notes (Additions Beyond Spec)

**`is_platform_admin` function**: Required to efficiently check platform admin status in RLS policies without repeatedly joining auth.users.

**PlatformAdminContext**: Added to cache the platform admin check and make it accessible throughout the app without repeated queries.

