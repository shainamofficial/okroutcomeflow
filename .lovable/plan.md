

# QA Assessment Report -- OutcomeFlow Platform

## Critical Bugs

### BUG-1: Signup navigates to /app before email verification
**File:** `src/pages/Signup.tsx` line 54
**Issue:** After `signUp()`, the code immediately calls `navigate('/app')` and shows "Welcome to OutcomeFlow!". But email confirmation is required (auto-confirm is not enabled). The user will land on the protected route, which will either show "Loading profile..." forever or redirect to login since the profile won't exist until email is confirmed.
**Fix:** After signup, show a "Check your email for verification" message instead of navigating to `/app`.

### BUG-2: `useAllTasks` returns tasks with `initiative` as an array due to `!inner` join, but code casts it as a single object
**File:** `src/hooks/useTasks.ts` line 196
**Issue:** The Supabase `!inner` join returns `initiative` as an array `{ id, organization_id }[]`, but `Task` interface doesn't include this field and the type cast hides it. Downstream consumers (e.g., Timeline) treat `task.initiative` as a single object. This may silently work due to Supabase flattening single FK joins, but the type is incorrect and fragile.
**Fix:** Update the type assertion and interface to accurately reflect the join shape.

### BUG-3: `ProtectedRoute` hangs on "Loading profile..." if profile creation trigger fails
**File:** `src/components/auth/ProtectedRoute.tsx` lines 29-34
**Issue:** If the database trigger that creates `users_profile` after signup fails or is delayed, the user sees "Loading profile..." indefinitely with no timeout or error handling.
**Fix:** Add a timeout (e.g., 10 seconds) that shows an error message and sign-out button if profile never loads.

---

## Medium Bugs

### BUG-4: Command palette search result selection doesn't open the specific item
**File:** `src/components/search/CommandPalette.tsx` lines 66-78
**Issue:** `handleSelect` navigates to the *page* (e.g., `/app/okrs` or `/app/initiatives`) but doesn't pass the selected item's ID. Users search for a specific task but land on the generic initiatives page with no indication of which item they searched for.
**Fix:** Pass the entity ID as a URL parameter or open the detail drawer directly.

### BUG-5: `useCustomFieldValues` query key uses unstable array reference
**File:** `src/hooks/useCustomFields.ts` line 92
**Issue:** `queryKey: ["custom_field_values", entityIds]` -- if `entityIds` is a new array reference on each render (which it is, from `useMemo` in TableView), React Query may refetch more than needed. However, React Query does deep comparison by default, so this is a performance concern rather than a hard bug.
**Fix:** Consider sorting and JSON-stringifying the entityIds array in the query key.

### BUG-6: Mobile task cards in TableView are read-only -- no way to edit
**File:** `src/pages/TableView.tsx` lines 162-185
**Issue:** The desktop table has inline editing, but the mobile card view (`MobileTaskCard`) is purely display-only. Users on mobile cannot edit task status, dates, or titles from the Table View.
**Fix:** Add tap-to-edit interactions or a "tap to open detail" action on mobile cards.

### BUG-7: Initiative status `replace("_", " ")` only replaces first underscore
**File:** `src/pages/MyItems.tsx` line 157
**Issue:** `initiative.status.replace("_", " ")` uses a string pattern, not regex, so it only replaces the first underscore. `not_started` becomes `not started` (works), but this is a latent bug if any status has multiple underscores.
**Fix:** Use `.replace(/_/g, " ")` consistently (TableView does this correctly).

### BUG-8: Notification Settings page header not responsive
**File:** `src/pages/NotificationSettings.tsx` line 23
**Issue:** The heading uses `text-3xl` without the responsive `text-xl sm:text-3xl` pattern applied to all other pages during the mobile optimization pass.
**Fix:** Change to `text-xl sm:text-3xl`.

### BUG-9: Notification preferences grid breaks on small screens
**File:** `src/pages/NotificationSettings.tsx` line 38
**Issue:** `grid-cols-[1fr_80px_80px]` creates a fixed 160px allocation for switches that doesn't adapt on very narrow screens (<320px). Content may overflow.
**Fix:** Use `grid-cols-[1fr_60px_60px] sm:grid-cols-[1fr_80px_80px]`.

---

## Low / UX Issues

### BUG-10: No password reset / forgot password flow
**File:** `src/pages/Login.tsx`
**Issue:** There is no "Forgot password?" link on the login page. Users who forget their password have no self-service recovery path.
**Fix:** Add a forgot password link that calls `supabase.auth.resetPasswordForEmail()`.

### BUG-11: No loading state for task inline updates in TableView
**File:** `src/pages/TableView.tsx` line 50
**Issue:** `updateTask` in TableView uses raw Supabase calls without showing a pending state. If the network is slow, users get no feedback that their edit is saving.
**Fix:** Add optimistic updates or a brief saving indicator.

### BUG-12: CSV export doesn't escape values containing commas or quotes
**File:** `src/pages/TableView.tsx` line 105
**Issue:** Values are wrapped in double quotes (`"${c}"`), but if `c` itself contains a double quote, the CSV will be malformed.
**Fix:** Escape inner double quotes by replacing `"` with `""` before wrapping.

### BUG-13: Memory leak potential in CSV export -- `URL.createObjectURL` cleanup
**File:** `src/pages/TableView.tsx` lines 106-112
**Issue:** The `a.click()` is synchronous but the download is async. `URL.revokeObjectURL(url)` is called immediately, which may revoke the URL before the browser starts the download.
**Fix:** Use `setTimeout(() => URL.revokeObjectURL(url), 1000)`.

### BUG-14: `recurrence_rule` column added but no UI or backend logic uses it
**File:** Migration `20260308215144` / `src/hooks/useTasks.ts`
**Issue:** The `recurrence_rule` jsonb column exists on `tasks` but there is no UI to set it, no backend function to create recurring task instances, and the `Task` interface doesn't include it. It's dead schema.
**Fix:** Either implement the recurring task feature or remove the column to avoid confusion.

### BUG-15: Task dependencies table exists but no UI to manage them
**File:** Migration `20260308214706`
**Issue:** The `task_dependencies` table was created with proper RLS, but there is no UI anywhere to add, view, or remove task dependencies. The feature is incomplete.
**Fix:** Add dependency management UI in the TaskDetailDrawer.

---

## Summary

| Severity | Count | Key Items |
|----------|-------|-----------|
| Critical | 3 | Signup flow, profile loading hang, task type mismatch |
| Medium | 6 | Search doesn't deep-link, mobile table read-only, responsive gaps |
| Low/UX | 6 | No password reset, dead schema, CSV escaping |

**Recommended priority order:**
1. Fix signup flow (BUG-1) -- users cannot onboard
2. Add profile loading timeout (BUG-3) -- users get stuck
3. Add forgot password (BUG-10) -- basic auth requirement
4. Fix mobile TableView editing (BUG-6) -- feature gap
5. Deep-link search results (BUG-4) -- broken UX expectation
6. Complete dependencies/recurring features or remove dead schema (BUG-14, BUG-15)

