

## Add Real Tests for `calculateProgress` and Route Guards

Replace the placeholder `example.test.ts` with two focused test suites covering the highest-leverage logic in the app: KR progress math and the auth route guards.

### File 1: `src/hooks/useKRMetrics.test.ts` (new)

Test the pure `calculateProgress` export. No mocks needed — it doesn't touch Supabase.

Time-window setup (re-used per test):
```ts
const today = new Date();
const start_date = new Date(today.getTime() - 100 * 86400_000).toISOString().slice(0, 10);
const end_date   = new Date(today.getTime() + 100 * 86400_000).toISOString().slice(0, 10);
// expectedProgress at "today" ≈ 0.5
```

Cases (matching the thresholds in source: `on_track` when `progress >= expected`, `at_risk` when within 0.1 below, else `off_track`):

1. **null config** → `status === "no_config"`, `currentValue === null`.
2. **empty values** → `status === "no_data"`.
3. **Increase direction** (start 0, target 100):
   - currentValue 50 → `progressPercent ≈ 0.5`, `on_track`.
   - currentValue 10 → `off_track` (0.1 vs 0.5 expected, gap > 0.1).
   - currentValue 45 → `at_risk` (0.45 vs 0.5, within 0.1). *(Spec says 35; that's 0.35 vs 0.5 = gap 0.15 → off_track. Will use 45 to actually exercise at_risk and note this in a comment so the user sees the threshold reasoning.)*
   - currentValue 150 → clamped to `1`. currentValue -10 → clamped to `0`.
4. **Decrease direction** (start 100, target 50, current 75) → `progressPercent ≈ 0.5`, `on_track`.
5. **Maintain direction** (start 99, target 99.9, current 99.9) → `progressPercent` close to `1`.
6. **Divide-by-zero guard** (start 50, target 50, current 50, increase) → finite number, no `Infinity`/`NaN`.

If any case actually fails against the current implementation (e.g. the threshold math doesn't match), the failure will be reported as a source bug per instructions — no source edits.

### File 2: `src/components/auth/routeGuards.test.tsx` (new)

Render each guard inside `MemoryRouter` with a sentinel child (`<div>PROTECTED</div>`) and an unrelated route to confirm redirects. Mock `@/contexts/AuthContext` with `vi.mock` and per-test `vi.mocked(useAuth).mockReturnValue(...)`.

Auth fixture shape (matches what the guards read):
```ts
{ user, profile: { status: 'active' }, roles, loading: false, signOut: vi.fn() }
```

Cases:
- **ProtectedRoute** unauthenticated (`user: null, profile: null`) → "PROTECTED" not in DOM.
- **ProtectedRoute** authenticated active → "PROTECTED" in DOM.
- **AdminRoute** with `roles: ['contributor']` → not rendered. Also mock `@/hooks/use-toast` to silence the toast side-effect.
- **AdminRoute** with `roles: ['admin']` → rendered.
- **ManagerRoute** with `roles: ['contributor']` → not rendered.
- **ManagerRoute** with `roles: ['manager']` → rendered. With `roles: ['admin']` → rendered.

Assertions use `screen.queryByText("PROTECTED")` — `null` for blocked, defined for allowed.

### File 3: `src/test/example.test.ts`

Delete.

### Out of scope
No changes to `useKRMetrics.ts`, the route guard components, `AuthContext`, or any other source. Test config (`vitest.config.ts`, `src/test/setup.ts`) is already in place.

