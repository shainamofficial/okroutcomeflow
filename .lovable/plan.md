

## Polish Pass: Closeout Fixes

Four small, scoped changes. One deviation from spec is called out below.

### 1. `.gitignore`

Insert after the existing `dist-ssr` line (line 12):

```
# Environment
.env
.env.local
.env.*.local
```

(The current `*.local` matches `.env.local` and `.env.production.local` already, but the explicit listing is what the spec asks for and makes intent obvious.)

### 2. `.env.example`

Rewrite with inline comments explaining the expected format of each value, exactly as specified in the request.

### 3. Split `src/pages/OrganizationSettings.tsx`

**Deviation from spec, called out explicitly:** The current page does **not** contain inline Cycles, Custom Fields, or Danger Zone sections. Its actual sections are:

- **Organization Profile** (name + logo)
- **Organization Domains** (add/verify/delete domains, with the only-verified-domain guards)
- **Developer Notes** (a small static info card)

Per the user's instruction ("if inline; otherwise leave as-is"), I will extract only what actually exists. New folder `src/components/organization/` with:

- **`OrganizationProfileSection.tsx`** — name input + logo upload. Owns `orgName`, `saving`, `uploadingLogo`, `fileInputRef`. Receives `organization` and an `onOrganizationChange` callback so the page stays the source of truth.
- **`OrganizationDomainsSection.tsx`** — full domain list, add form, verify toggle, delete dialog. Owns `newDomain`, `addingDomain`. Receives `domains`, `organizationId`, and `onDomainsChange` for parent state sync. The `normalizeDomain`, `canDeleteDomain`, `canToggleVerified`, and `formatDate` helpers move with it (they're only used here).
- **`DeveloperNotesSection.tsx`** — purely static JSX, no props.

`OrganizationSettings.tsx` becomes a thin shell: keeps the data fetch (`fetchData` + `useEffect`), holds `organization`/`domains`/`loading` state, renders the page header, then composes the three sections in the same stacked order with the same `space-y-6 max-w-3xl` wrapper. **No Tabs** — the current layout is stacked Cards and the spec says "matching the current visual layout exactly."

No mutation logic, no Supabase call, no toast, no copy changes — only JSX and co-located helpers move. The `Organization` and `OrganizationDomain` interfaces will be exported from a new `src/components/organization/types.ts` so all three files share them without circular imports.

### 4. README "Deploy" section

Append after the existing env-var sentence on line 80:

> Remember to set `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` in your hosting provider's environment variables. Without these, the production build will fail to connect to Supabase.

### Out of scope
No changes to routes, hooks, mutations, RLS, Supabase calls, or any other page. If the split surfaces TypeScript errors (e.g. prop mismatches), I'll stop and report rather than patch.

