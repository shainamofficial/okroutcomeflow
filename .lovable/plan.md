

# Prompt 10: Updates + Comments + Mentions

## Overview

This feature adds collaborative capabilities to KRs, initiatives, and tasks through an activity feed system with comments, progress updates, blockers, decisions, mentions, and reactions.

---

## Database Schema

### New Tables

| Table | Purpose |
|-------|---------|
| `updates` | Stores activity feed items for KRs, initiatives, and tasks |
| `update_mentions` | Links updates to mentioned users |
| `update_reactions` | Stores user reactions to updates |

### New Enums

| Enum | Values |
|------|--------|
| `entity_type` | `kr`, `initiative`, `task` |
| `update_kind` | `comment`, `progress`, `blocker`, `decision` |

### Schema Details

```text
updates
+--------------------+---------------------------+
| Column             | Type                      |
+--------------------+---------------------------+
| id                 | UUID (PK, auto)           |
| organization_id    | UUID (FK organizations)   |
| entity_type        | entity_type enum          |
| entity_id          | UUID                      |
| user_id            | UUID (FK users_profile)   |
| update_kind        | update_kind enum          |
| content            | TEXT                      |
| pinned             | BOOLEAN (default false)   |
| created_at         | TIMESTAMPTZ (auto)        |
+--------------------+---------------------------+

update_mentions
+--------------------+---------------------------+
| Column             | Type                      |
+--------------------+---------------------------+
| id                 | UUID (PK, auto)           |
| update_id          | UUID (FK updates CASCADE) |
| mentioned_user_id  | UUID (FK users_profile)   |
+--------------------+---------------------------+
UNIQUE(update_id, mentioned_user_id)

update_reactions
+--------------------+---------------------------+
| Column             | Type                      |
+--------------------+---------------------------+
| id                 | UUID (PK, auto)           |
| update_id          | UUID (FK updates CASCADE) |
| user_id            | UUID (FK users_profile)   |
| reaction_type      | TEXT                      |
+--------------------+---------------------------+
UNIQUE(update_id, user_id, reaction_type)
```

---

## Security (RLS Policies)

### Helper Functions

Create a helper function to check entity ownership:

```text
can_manage_update(user_id, entity_type, entity_id)
- Returns TRUE if user is admin/manager
- Returns TRUE if user owns the entity:
  - KR: owner_id matches
  - Initiative: owner_id matches
  - Task: assignee_user_id matches OR user is member of assignee_team_id
```

### RLS Policy Summary

| Table | Operation | Rule |
|-------|-----------|------|
| updates | SELECT | Same organization |
| updates | INSERT | Org member, enforces permission rules |
| updates | UPDATE (pinned) | Admin, manager, or entity owner |
| updates | DELETE | Author only, or admin/manager |
| update_mentions | SELECT | Same organization (via update) |
| update_mentions | INSERT | Update author only |
| update_mentions | DELETE | Update author only |
| update_reactions | SELECT | Same organization (via update) |
| update_reactions | INSERT | Any org member |
| update_reactions | DELETE | Reaction owner only |

---

## Frontend Components

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useUpdates.ts` | CRUD operations for updates, mentions, reactions |
| `src/components/updates/ActivityFeed.tsx` | Main feed container with filter dropdown |
| `src/components/updates/UpdateItem.tsx` | Individual update display with reactions |
| `src/components/updates/UpdateComposer.tsx` | Input with @mention support |
| `src/components/updates/UpdateKindBadge.tsx` | Visual badge for update type |
| `src/components/updates/ReactionPicker.tsx` | Emoji reaction selector |
| `src/components/updates/MentionInput.tsx` | Text input with @mention autocomplete |

### Integration Points

The ActivityFeed component will be added to:
- `KRDetailPanel.tsx` - Below review cadence section
- `InitiativeDetailDrawer.tsx` - Below tasks section
- `TaskList.tsx` - Add task detail drawer with activity feed

---

## Permission Logic

### Comment Access (All authenticated users can comment)

Everyone in the organization can post comments on any entity.

### Progress/Blocker/Decision Updates

| Role | KR | Initiative | Task |
|------|-----|-----------|------|
| Admin | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes |
| KR Owner | Yes | - | - |
| Initiative Owner | - | Yes | - |
| Task Assignee (user) | - | - | Yes |
| Task Assignee (team member) | - | - | Yes |
| Viewer | No | No | No |
| Contributor (non-owner) | No | No | No |

### Pin/Unpin Updates

Only admin, manager, or entity owner can pin/unpin updates.

---

## UI Features

### Activity Feed

- Displays updates in reverse chronological order (newest first)
- Filter dropdown to filter by `update_kind`
- Pinned updates shown at top with visual indicator
- Each update shows:
  - Author avatar and name
  - Update kind badge
  - Content with rendered @mentions as links
  - Timestamp
  - Reaction bar
  - Pin/unpin button (if authorized)

### Composer

- Textarea with @mention autocomplete
- Dropdown to select update kind
- Update kind selection:
  - All users see "Comment" option
  - Owners/managers see all options
- Submit button

### Reactions

- Click to add reaction (emoji picker)
- Show reaction counts grouped by type
- Click existing reaction to add/remove own reaction

---

## Implementation Steps

1. **Database Migration**
   - Create enums: `entity_type`, `update_kind`
   - Create tables: `updates`, `update_mentions`, `update_reactions`
   - Create helper function: `can_manage_update`
   - Apply RLS policies

2. **Hook: useUpdates.ts**
   - `useUpdates(entityType, entityId)` - Fetch updates with author, mentions, reactions
   - `useCreateUpdate()` - Create update with mentions
   - `useTogglePin()` - Pin/unpin update
   - `useDeleteUpdate()` - Delete update
   - `useReactions()` - Add/remove reactions

3. **Components**
   - Build `UpdateKindBadge` component
   - Build `MentionInput` with user autocomplete
   - Build `UpdateComposer` with kind selection
   - Build `ReactionPicker` component
   - Build `UpdateItem` component
   - Build `ActivityFeed` container

4. **Integration**
   - Add ActivityFeed to KRDetailPanel
   - Add ActivityFeed to InitiativeDetailDrawer
   - Create TaskDetailDrawer and add ActivityFeed

---

## Technical Details

### Mention Detection

Extract mentions from content using regex pattern `@[username]` or by detecting selected users from autocomplete.

### Reaction Types

Common emoji reactions: `thumbs_up`, `thumbs_down`, `heart`, `celebrate`, `thinking`, `eyes`

### Query Pattern

```typescript
// Fetch updates with related data
supabase
  .from("updates")
  .select(`
    *,
    user:users_profile!updates_user_id_fkey(id, name, email, avatar_url),
    mentions:update_mentions(
      id,
      mentioned_user:users_profile!update_mentions_mentioned_user_id_fkey(id, name, email)
    ),
    reactions:update_reactions(
      id,
      user_id,
      reaction_type
    )
  `)
  .eq("entity_type", entityType)
  .eq("entity_id", entityId)
  .order("pinned", { ascending: false })
  .order("created_at", { ascending: false })
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/...` | Create tables, enums, RLS |
| `src/hooks/useUpdates.ts` | New hook |
| `src/components/updates/UpdateKindBadge.tsx` | New component |
| `src/components/updates/MentionInput.tsx` | New component |
| `src/components/updates/UpdateComposer.tsx` | New component |
| `src/components/updates/ReactionPicker.tsx` | New component |
| `src/components/updates/UpdateItem.tsx` | New component |
| `src/components/updates/ActivityFeed.tsx` | New component |
| `src/components/okrs/KRDetailPanel.tsx` | Add ActivityFeed |
| `src/components/initiatives/InitiativeDetailDrawer.tsx` | Add ActivityFeed |
| `src/components/tasks/TaskDetailDrawer.tsx` | New component with ActivityFeed |
| `src/components/tasks/TaskList.tsx` | Open TaskDetailDrawer on click |

