

## Restricted Initiative Sharing (Email-Gated View-Only Links)

### Overview
Instead of a fully public share link, initiative owners/admins can specify a list of email addresses who are allowed to view the shared summary. Visitors must verify their email (via a simple magic-link or OTP code) before seeing the content.

### How It Works

```text
Owner clicks "Share" → enters email addresses → backend stores allowed viewers
                                                        ↓
Recipient opens /share/initiative/:token → enters their email → receives OTP code via email
                                                        ↓
Edge function validates OTP → returns initiative data only if email is in allowed list
```

### Database

**Table: `initiative_share_links`**
- `id uuid PK`
- `initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE`
- `token text NOT NULL UNIQUE` (random UUID)
- `created_by uuid`
- `is_active boolean DEFAULT true`
- `created_at timestamptz DEFAULT now()`
- RLS: only org admins/managers/initiative owners can INSERT/UPDATE/SELECT

**Table: `initiative_share_viewers`**
- `id uuid PK`
- `share_link_id uuid NOT NULL REFERENCES initiative_share_links(id) ON DELETE CASCADE`
- `email text NOT NULL`
- `UNIQUE(share_link_id, email)`
- RLS: same as share_links (managed via edge function with service role)

**Table: `share_link_otps`** (short-lived verification codes)
- `id uuid PK`
- `share_link_id uuid NOT NULL`
- `email text NOT NULL`
- `otp_code text NOT NULL`
- `expires_at timestamptz NOT NULL` (5 min TTL)
- `verified boolean DEFAULT false`
- `created_at timestamptz DEFAULT now()`
- No RLS needed (only accessed by edge functions via service role)

### Edge Functions

**`send-share-otp`** -- Receives `{ token, email }`. Validates that the token exists, is active, and email is in the allowed viewers list. Generates a 6-digit OTP, stores it in `share_link_otps`, and sends it via email (using Lovable AI or a simple Supabase auth email helper). Returns success/error.

**`verify-share-otp`** -- Receives `{ token, email, otp }`. Validates the OTP hasn't expired and matches. If valid, marks it verified and returns a short-lived session JWT (signed with a secret) that the frontend stores in sessionStorage.

**`get-shared-initiative`** -- Receives `{ token }` + session JWT in header. Validates the JWT, extracts the email, confirms it's in the allowed viewers list. Then fetches initiative details, tasks/subtasks, linked KRs, updates/comments using service role. Returns sanitized data (no internal emails, just display names).

### Frontend

**`src/pages/SharedInitiative.tsx`** -- Public route `/share/initiative/:token`
- State machine: `loading → email-entry → otp-verification → viewing`
- Email entry: simple input asking "Enter your email to access this initiative"
- OTP screen: 6-digit input with resend option
- On verification: stores session token in sessionStorage, fetches and renders the read-only summary
- Summary sections: header/status, progress bar, mini timeline (tasks/subtasks), linked KRs, comments feed

**`src/components/initiatives/ShareInitiativeDialog.tsx`** -- Opened from InitiativeDetailDrawer
- Create/manage share link
- Add/remove allowed email addresses (chips input)
- Copy shareable URL
- Toggle link active/inactive
- Shows list of current viewers

**`src/components/initiatives/InitiativeDetailDrawer.tsx`** -- Add "Share" button (visible to owners/admins/managers)

**`src/App.tsx`** -- Add public route: `<Route path="/share/initiative/:token" element={<SharedInitiative />} />`

### Files Summary

| File | Change |
|------|--------|
| DB migration | 3 new tables: `initiative_share_links`, `initiative_share_viewers`, `share_link_otps` |
| `supabase/functions/send-share-otp/index.ts` | New: send OTP to allowed email |
| `supabase/functions/verify-share-otp/index.ts` | New: verify OTP, return session token |
| `supabase/functions/get-shared-initiative/index.ts` | New: fetch initiative data with auth check |
| `src/pages/SharedInitiative.tsx` | New: email-gated read-only summary page |
| `src/components/initiatives/ShareInitiativeDialog.tsx` | New: manage share link + viewer emails |
| `src/components/initiatives/InitiativeDetailDrawer.tsx` | Add Share button |
| `src/App.tsx` | Add `/share/initiative/:token` route |
| `supabase/config.toml` | Add `verify_jwt = false` for 3 edge functions |

### Security
- Tokens are random UUIDs (not guessable)
- Only emails explicitly added by the owner can request an OTP
- OTPs expire after 5 minutes
- Session JWTs are short-lived (24h) and scoped to a specific share link + email
- No user account required for viewers -- just email verification
- Links can be revoked; viewer emails can be removed at any time

