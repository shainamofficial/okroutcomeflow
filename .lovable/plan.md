
## Create InfoTooltip Component

Add a small reusable `InfoTooltip` that wraps the shadcn Tooltip primitives with an info (i) icon trigger.

### File

**New:** `src/components/ui/InfoTooltip.tsx`

### Component Spec

- **Imports**: `Info` from `lucide-react`; `Tooltip`, `TooltipContent`, `TooltipTrigger` from `@/components/ui/tooltip`; `cn` from `@/lib/utils`; `ReactNode` from React.
- **Props**:
  - `children: ReactNode` — tooltip body content
  - `side?: "top" | "right" | "bottom" | "left"` (default `"top"`)
  - `className?: string` — extra classes for the icon button
  - `contentClassName?: string` — extra classes for the tooltip body
  - `iconSize?: number` (default `14`)
  - `label?: string` (default `"More info"`) — used as `aria-label`
- **Render**:
  - `<Tooltip delayDuration={150}>`
  - `<TooltipTrigger asChild>` wrapping a `<button type="button">` with `onClick={(e) => e.preventDefault()}`, `aria-label={label}`, and merged classes:
    `"inline-flex items-center justify-center align-middle ml-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"` + `className`
  - Inside the button: `<Info style={{ width: iconSize, height: iconSize }} />` (size via inline style, not Tailwind)
  - `<TooltipContent side={side} className={cn("max-w-xs text-xs leading-relaxed", contentClassName)}>{children}</TooltipContent>`
- **Notes**: Component assumes a `TooltipProvider` exists higher in the tree (already provided app-wide via shadcn setup). No barrel file changes; no other files touched.

### Why
A reusable, accessible inline help affordance for forms and labels — hover and keyboard focus both reveal the tooltip, and it never accidentally submits enclosing forms.
