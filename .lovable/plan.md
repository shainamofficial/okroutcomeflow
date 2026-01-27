
# Fix Blank Page When Clicking Initiative from KR Page

## Problem Identified

When clicking on an initiative linked to a Key Result in the OKR page, the application shows a blank page because:

1. **Incomplete Data Fetch**: The `useKRInitiativeLinks` hook only fetches partial initiative data (`id`, `title`, `status`, `owner`)
2. **Type Mismatch**: The `KRLinkedInitiatives` component casts this partial data to a full `Initiative` interface
3. **Runtime Error**: The `InitiativeDetailDrawer` tries to access `initiative.created_at` (which is undefined), causing `format(new Date(undefined), ...)` to crash

## Solution

Update the `useKRInitiativeLinks` hook to fetch all required initiative fields that `InitiativeDetailDrawer` needs:
- `organization_id`
- `description`
- `start_date`
- `end_date`
- `created_by`
- `created_at`

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useInitiatives.ts` | Update `useKRInitiativeLinks` to fetch complete initiative data |

## Implementation Details

Update the Supabase select query in `useKRInitiativeLinks` from:

```typescript
// Current (partial data)
initiative:initiatives(
  id,
  title,
  status,
  owner:users_profile!initiatives_owner_id_fkey(id, name, email)
)
```

To:

```typescript
// Fixed (complete data)
initiative:initiatives(
  id,
  organization_id,
  title,
  description,
  owner_id,
  status,
  start_date,
  end_date,
  created_by,
  created_at,
  owner:users_profile!initiatives_owner_id_fkey(id, name, email)
)
```

This ensures the `InitiativeDetailDrawer` receives all the fields it needs to render properly.

## Testing

After the fix:
1. Navigate to the OKRs page
2. Find a Key Result with linked initiatives
3. Click on the initiative badge
4. The detail drawer should open and display all initiative information correctly
