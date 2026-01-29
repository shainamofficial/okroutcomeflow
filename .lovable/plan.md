
# Handle Generic Email Domains for Invite-Only Organizations

This plan prevents users with generic consumer email domains (Gmail, Hotmail, Yahoo, etc.) from claiming those domains for their organization. Instead, their organizations will be invite-only.

## Overview

When a user signs up with a generic email domain like `gmail.com`:
- They can still create a new organization and become its admin
- However, **no domain will be registered** for that organization
- New members can only join via invitation (existing invitation system)
- The organization can later add a verified corporate domain if they have one

## Database Changes

### 1. Create a Generic Domains Table

Store a list of blocked/generic email domains that cannot be claimed:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `domain` | text | The generic domain (e.g., gmail.com) |
| `created_at` | timestamp | When added |

**Initial seed data** (common consumer email providers):
- gmail.com
- googlemail.com
- hotmail.com
- outlook.com
- live.com
- msn.com
- yahoo.com
- yahoo.co.uk
- ymail.com
- aol.com
- icloud.com
- me.com
- mac.com
- protonmail.com
- proton.me
- zoho.com
- mail.com
- gmx.com
- gmx.net
- fastmail.com

### 2. Create Helper Function

Add a function to check if a domain is generic:

```text
is_generic_domain(domain TEXT) -> BOOLEAN
```

### 3. Update `handle_new_user()` Function

Modify the logic when creating a new organization:

```text
Current flow:
┌─────────────────────────────────────────────────────────┐
│ Domain exists? ──Yes──> Join existing org (pending)    │
│      │                                                  │
│      No                                                 │
│      v                                                  │
│ Create org + Register domain (verified) + Active admin │
└─────────────────────────────────────────────────────────┘

New flow:
┌─────────────────────────────────────────────────────────┐
│ Domain exists in org_domains? ──Yes──> Join (pending)  │
│      │                                                  │
│      No                                                 │
│      v                                                  │
│ Is generic domain? ──Yes──> Create org (NO domain)     │
│      │                       + Active admin             │
│      No                                                 │
│      v                                                  │
│ Create org + Register domain (verified) + Active admin │
└─────────────────────────────────────────────────────────┘
```

### 4. Update Organization Settings UI

Block admins from adding generic domains manually:

- Check against `generic_domains` table before inserting
- Show clear error message: "Generic email domains like gmail.com cannot be added"

## Frontend Changes

### 1. Organization Settings Page

Update `OrganizationSettings.tsx` to:
- Validate new domains against the generic domains list before adding
- Display helpful message explaining why generic domains are blocked

### 2. Optional: Add Indicator for Invite-Only Orgs

Show a badge or message on the domain settings card if an organization has no domains:
- "This organization is invite-only. Add a domain to allow automatic signups."

## Files to Modify

| File | Changes |
|------|---------|
| New migration | Create `generic_domains` table, `is_generic_domain()` function, update `handle_new_user()` |
| `src/pages/OrganizationSettings.tsx` | Add generic domain validation when adding domains |

## Security Considerations

- The `generic_domains` table should be readable by authenticated users (to check before adding)
- Only platform admins should be able to modify the generic domains list
- RLS policies will enforce these restrictions

## User Experience

**For users signing up with generic emails:**
1. Sign up with `user@gmail.com`
2. Organization created, user becomes admin (active)
3. Domain settings show: "No domains configured. This organization is invite-only."
4. Admin can invite members via the existing invitation system
5. Admin can add a corporate domain later if available

**For users signing up with corporate emails:**
1. Sign up with `user@acme.com`
2. If `acme.com` not claimed: Organization created with domain verified
3. If `acme.com` already exists: User joins that org as pending contributor

## Testing Scenarios

1. Sign up with `test@gmail.com` → Creates invite-only org (no domain)
2. Sign up with `test@company.com` → Creates org with `company.com` verified
3. Try to add `gmail.com` as domain in settings → Error message shown
4. Add `company.com` as domain in settings → Works normally
