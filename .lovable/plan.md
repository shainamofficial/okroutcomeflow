

## First-Run Concept Walkthrough on Dashboard

A 4-step, dismissible onboarding dialog that teaches the Objective → Key Result → Initiative → Task model. Auto-opens once on first Dashboard visit, never again.

### Files

**New:** `src/components/app/ConceptWalkthrough.tsx`
- Imports: `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`; `Button`; `Target, Flag, Lightbulb, CheckSquare, ArrowRight, Sparkles` (+ `LucideIcon` type) from `lucide-react`; `cn` from `@/lib/utils`.
- Persistence: localStorage key `"okr_concept_walkthrough_seen_v1"`. On mount, if missing → open. Skip / Get started / close → write `"1"` and close. Wrapped in try/catch.
- State: `open: boolean`, `step: number` (0–3).
- Steps (verbatim copy): Objectives (Flag, purple tile), Key Results (Target, blue), Initiatives (Lightbulb, amber), Tasks (CheckSquare, emerald) — each `{ icon, iconBg, title, subtitle, body, example }`.
- Header: small `Sparkles` + "Welcome to OKRoutcomeFlow" pre-title (text-xs muted). `DialogTitle` "How this app works". `DialogDescription` "A 30-second tour of the four concepts that connect strategy to daily work."
- Body: horizontal `flex gap-4`. Left: `h-10 w-10 rounded-lg` tile using `iconBg`, icon `h-5 w-5`. Right: title + subtitle inline (`text-xs text-muted-foreground`), body (`text-sm text-muted-foreground`), example card (`rounded-md border bg-muted/30 p-3 text-sm`) with "Example: " muted prefix and example in `font-medium`.
- Progress dots: 4 buttons, `h-1.5 rounded-full`. Active = `w-6 bg-primary`, inactive = `w-1.5 bg-muted-foreground/30`. Clicking jumps to that step.
- Footer (`sm:justify-between`): left = "Skip" (ghost) → dismiss. Right = "Back" (outline, only when `step > 0`), then "Next" (with `ArrowRight`) or "Get started" on the last step.

**Edited:** `src/pages/Dashboard.tsx`
- Add `import { ConceptWalkthrough } from "@/components/app/ConceptWalkthrough";` alongside existing component imports.
- Render `<ConceptWalkthrough />` as the first child of the existing outer `<div className="space-y-8">`, above the welcome heading. Nothing else changes.

### Out of scope
No other files. No backend, no analytics. Persistence is localStorage only (per-browser).

