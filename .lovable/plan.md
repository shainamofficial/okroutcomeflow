

## Single-Page Help & Glossary

Create a long-form glossary at `/app/help` and surface it from the header. Becomes the destination for "Learn more" links from `InfoTooltip` later.

### File 1: `src/pages/Help.tsx` (new)

A single scrollable page rendered inside the existing `AppLayout` (provided by the route).

Layout:
- **Page header** — `<h1>` "Help & Glossary" + muted subtitle ("A single-page reference for every concept in OKRoutcomeFlow. Use Cmd/Ctrl+F to search.").
- **Sticky anchor nav** — `sticky top-0 z-10 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 bg-background/80 backdrop-blur border-b border-border/60`. Horizontally scrollable `<nav>` of `<a href="#anchor">` chips for: Objectives, Key Results, Initiatives, Tasks, Reviews, Automations, Custom Fields, Roles, Status (KR), Status (Initiative), Status (Task). Sits inside the page (the `AppHeader` is already sticky above it; the anchor bar sticks below it).
- **Sections** — `<div className="space-y-12 mt-8">` wrapping eleven `<section id="..." className="space-y-4 scroll-mt-24">` blocks. Each: `<h2 className="text-2xl font-display font-semibold">`, definition `<p className="text-muted-foreground leading-relaxed">`, optional `<h3 className="text-sm font-semibold uppercase tracking-wide">Why it matters</h3>` + paragraph, and optional example rendered as `<div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Example: </span>…</div>`.

Verbatim copy from the spec drives every section. Roles and the three Status sections render their items as definition lists (`<dl>` with bold term + muted description) for scannability.

Section ids match anchor hrefs:
`objectives`, `key-results`, `sub-key-results`, `initiatives`, `tasks`, `reviews`, `automations`, `custom-fields`, `roles`, `status-kr`, `status-initiative`, `status-task`.

(Sub Key Results is included as a section but not in the top nav per the spec list — the user listed 11 nav items and 12 sections, so Sub-KRs lives under the Key Results anchor visually but gets its own `<section>` between KRs and Initiatives.)

Outer wrapper: `<div className="max-w-3xl mx-auto pb-16">` for comfortable line length.

### File 2: `src/App.tsx`

- Add `import Help from "./pages/Help";` near the other page imports.
- Add a new protected route immediately after another `/app/...` route (e.g. after `/app/calendar` or wherever fits the existing list):

```tsx
<Route
  path="/app/help"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Help />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

No other route changes.

### File 3: `src/components/app/AppHeader.tsx`

- Imports: add `HelpCircle` to the existing `lucide-react` import; add `import { Link } from 'react-router-dom';` and `import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';`.
- Insert a help button into the right-side icon cluster, between `ThemeToggle` and `NotificationBell`:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
      <Link to="/app/help" aria-label="Help & Glossary">
        <HelpCircle className="h-4 w-4" />
      </Link>
    </Button>
  </TooltipTrigger>
  <TooltipContent>Help & Glossary</TooltipContent>
</Tooltip>
```

(Confirm `TooltipProvider` is already mounted at the app root — Lovable's shadcn setup ships it via the global toaster wrapper. If not, the `Tooltip` will still render but without the floating content; will adjust during implementation if needed.)

### Out of scope
- `AppSidebar.tsx` — intentionally untouched per spec; Help stays out of the main nav.
- `InfoTooltip` — does not yet get a "Learn more" link in this pass; that's a follow-up that can deep-link to specific section ids (`/app/help#kr-status`, etc.).
- No new components, no design tokens added — uses existing `bg-muted/30`, `border-border`, `text-muted-foreground`.

