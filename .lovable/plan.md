

# Plan: Auto-Link Parent Key Results to Initiatives

## Overview
When a user links a sub-KR to an initiative, the system will automatically detect and link all parent KRs in the hierarchy (up to the top-level KR under the objective). This ensures that initiatives always show the complete KR chain they're contributing to.

## Current Behavior
- Users can select any Key Result (including sub-KRs) to link to an initiative
- Only the explicitly selected KRs are stored in the `initiative_kr_links` table
- Parent KRs are not automatically included

## Proposed Changes

### 1. Update KRMultiSelect Component
**File**: `src/components/initiatives/KRMultiSelect.tsx`

- **Show KR hierarchy visually**: Display KRs with indentation to show their nesting level (using the `parent_kr_id` relationship)
- **Group by Objective**: Organize KRs under their parent objective headers for better context
- **Add visual indicator**: Show which KRs will be auto-linked when selecting a child

### 2. Create Utility Function to Get Parent Chain
**File**: `src/hooks/useInitiatives.ts` (or new utility)

Create a helper function that:
- Takes a KR ID and the full list of KRs
- Walks up the hierarchy via `parent_kr_id`
- Returns all ancestor KR IDs including the original

```text
getKRParentChain(krId, allKeyResults) -> [selectedKR, parentKR, grandparentKR, ...]
```

### 3. Update Selection Logic
**File**: `src/components/initiatives/KRMultiSelect.tsx`

When a user selects a sub-KR:
1. Calculate the parent chain for that KR
2. Automatically add all parent KRs to the selection (if not already selected)
3. Show visual feedback that parents were auto-added
4. Optionally mark auto-linked KRs differently (e.g., "linked via child")

### 4. Update Deselection Logic
**File**: `src/components/initiatives/KRMultiSelect.tsx`

When a user deselects a KR:
- If it's a parent KR: Check if any child KRs are still selected
  - If children remain selected, prevent deselection or show warning
- If it's a leaf KR: Allow deselection and check if parent can be removed
  - Only remove parent if no other children depend on it

### 5. Enhance Initiative Detail Drawer
**File**: `src/components/initiatives/InitiativeDetailDrawer.tsx`

- Group linked KRs by their hierarchy
- Show indentation to indicate which KRs are parents vs directly linked
- Optionally mark which KRs were "auto-linked via sub-KR"

---

## Technical Details

### Parent Chain Calculation
```text
function getKRAncestors(krId: string, allKRs: KeyResult[]): string[] {
  const result: string[] = [krId];
  let currentKR = allKRs.find(kr => kr.id === krId);
  
  while (currentKR?.parent_kr_id) {
    result.push(currentKR.parent_kr_id);
    currentKR = allKRs.find(kr => kr.id === currentKR.parent_kr_id);
  }
  
  return result;
}
```

### Updated Selection Handler
When user selects a KR:
1. Get all ancestors of the selected KR
2. Merge with existing selections (avoiding duplicates)
3. Update state with combined list

### KR Hierarchy Display
Build a tree structure for display:
- Group KRs by `objective_id` (for L1 KRs)
- Nest sub-KRs under their `parent_kr_id`
- Add indentation (e.g., `ml-4` per level) for visual hierarchy

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/initiatives/KRMultiSelect.tsx` | Add hierarchy display, auto-link parents on selection, smart deselection logic |
| `src/hooks/useInitiatives.ts` | Add helper function for calculating KR ancestry chain |
| `src/components/initiatives/CreateInitiativeDialog.tsx` | Pass objectives data to KRMultiSelect for grouping |
| `src/components/initiatives/EditInitiativeDialog.tsx` | Pass objectives data to KRMultiSelect for grouping |
| `src/components/initiatives/InitiativeDetailDrawer.tsx` | Show linked KRs with hierarchy indicators |

---

## User Experience

1. **Selecting a sub-KR**: User selects "Increase Mobile Downloads" (L3 KR)
   - System auto-adds "Improve App Store Presence" (L2 parent)
   - System auto-adds "Grow User Base" (L1 parent)
   - UI shows all three as linked, with L1 and L2 marked as "auto-linked"

2. **Visual hierarchy in dropdown**:
   ```text
   Objective: Q1 Growth
     ├─ Grow User Base (L1)
     │   ├─ Improve App Store Presence (L2)
     │   │   └─ Increase Mobile Downloads (L3)
     │   └─ Launch Referral Program (L2)
     └─ Increase Revenue (L1)
   ```

3. **Deselecting parent**: If user tries to deselect "Grow User Base" while "Increase Mobile Downloads" is selected, show a message explaining the dependency

