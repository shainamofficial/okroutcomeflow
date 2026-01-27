
# Fix Blank Screen When Opening Key Result Dialogs

## Problem Summary
The blank screen issue is caused by **Radix UI Select components** that have an empty string `value=""` for the "No owner" option. Radix UI Select does not support empty strings as valid values, causing the component to crash and render nothing.

## Root Causes Found

### 1. EditKeyResultDialog.tsx (Primary Issue)
- Line 98 has `<SelectItem value="">No owner</SelectItem>` which causes the crash
- Line 36 initializes `ownerId` with `keyResult.owner_id || ""` - when there's no owner, this becomes an empty string
- Line 47 in useEffect also sets `setOwnerId(keyResult.owner_id || "")`

### 2. CreateKeyResultDialog.tsx (Already Fixed)
- This was fixed in the previous edit to use `value="none"` instead of `value=""`

## Solution

### Step 1: Fix EditKeyResultDialog.tsx
Update the Select component to use `"none"` instead of empty string:

1. Change the initial state from `""` to `"none"`:
   - Line 36: `const [ownerId, setOwnerId] = useState<string>(keyResult.owner_id || "none");`

2. Update the useEffect to set `"none"` when there's no owner:
   - Line 47: `setOwnerId(keyResult.owner_id || "none");`

3. Change the SelectItem value:
   - Line 98: `<SelectItem value="none">No owner</SelectItem>`

4. Update the mutation call to convert `"none"` back to `undefined`:
   - Line 58: `ownerId: ownerId === "none" ? undefined : ownerId,`

## Files to Modify

| File | Change |
|------|--------|
| `src/components/okrs/EditKeyResultDialog.tsx` | Replace empty string `""` with `"none"` for owner selection |

## Technical Details

The fix follows the same pattern already applied to `CreateKeyResultDialog.tsx`:

```typescript
// Before (causes crash)
const [ownerId, setOwnerId] = useState<string>(keyResult.owner_id || "");
<SelectItem value="">No owner</SelectItem>
ownerId: ownerId || undefined,

// After (works correctly)
const [ownerId, setOwnerId] = useState<string>(keyResult.owner_id || "none");
<SelectItem value="none">No owner</SelectItem>
ownerId: ownerId === "none" ? undefined : ownerId,
```

## Testing
After the fix, verify:
1. Click "Add one" to create a Key Result - dialog should open properly
2. Click the edit (pencil) icon on an existing Key Result - dialog should open properly
3. Selecting "No owner" in either dialog should work correctly
4. Saving with or without an owner should work correctly
