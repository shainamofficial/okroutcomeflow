

## Educational Empty State for OKRs Page

Replace the bare empty state on the OKRs page with one that teaches what OKRs are, shows a worked example, and lists guidance tips. The loading state, page header, and the populated branch (mapping over objectives) remain unchanged.

### File: `src/pages/OKRs.tsx`

- Add `Flag` and `CheckCircle2` to the existing `lucide-react` import. Import `ReactNode` from React.
- Add two local components above the page component:
  - **`Tip({ children })`** — flex row with a primary-colored `CheckCircle2` (`h-4 w-4 mt-0.5 shrink-0`) and muted `text-sm` body text.
  - **`EmptyState({ canManage })`** — a `mx-auto max-w-2xl rounded-2xl border bg-card p-8 sm:p-10` card containing:
    - **Centered header** — the existing `h-14 w-14 rounded-2xl bg-accent` `Target` tile, "No objectives yet" heading, and a muted paragraph: *"OKRs connect company strategy to daily work. Set a few ambitious **Objectives** for the cycle, then define 3–5 measurable **Key Results** under each."* (Objectives / Key Results wrapped in `<strong className="text-foreground">`).
    - **Example card** (`rounded-lg border bg-muted/30 p-4`):
      - Header: small `Flag` + "EXAMPLE" (`text-xs font-semibold uppercase tracking-wide text-muted-foreground`).
      - Parent objective row: `Flag` icon + "Become the preferred marketplace for US jewelers" (`text-sm font-medium`).
      - `border-l-2 border-muted pl-4` container with three KR rows — each a small `Target` icon + muted text; numbers wrapped in `<span className="text-foreground font-medium">`:
        - "Grow monthly active buyers from **200** to **500**"
        - "Reduce checkout drop-off from **38%** to **20%**"
        - "Reach NPS of **50** from **32**"
    - **Three `Tip` rows**:
      - "Objectives are qualitative and inspirational — not tasks."
      - "Key Results start with a verb and end with a number. Each has one owner."
      - "Projects you run to move KRs live under **Initiatives**." (Initiatives bold)
    - **Centered footer**: if `canManage` → `<CreateObjectiveDialog />`; else → centered muted line "Ask an admin or manager to create the first objective."
- Replace only the `objectives.length === 0` branch in the page with `<EmptyState canManage={canManage} />`. The header section, loading branch, and `objectives.map(...)` rendering stay exactly as they are.

### Out of scope
No other files. No data, hook, or routing changes.

