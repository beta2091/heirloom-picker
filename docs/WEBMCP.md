# WebMCP spike (Chrome origin trial)

Evenkeep registers a small set of **read-first** tools via
`document.modelContext.registerTool` so a page agent (Gemini in Chrome, or the
[Model Context Tool Inspector](https://developer.chrome.com/docs/ai/webmcp))
can see what this signed-in session already sees.

This is progressive enhancement. The app works with **zero** WebMCP. If
`document.modelContext` is missing, registration is a no-op and nothing crashes
(including during SSR-style `document`-less evaluation).

`navigator.modelContext` is only a fallback. It is deprecated in Chrome 150.

## Tools

| Tool | Where | What it does | What it never does |
|---|---|---|---|
| `list_estates` | All pages | Returns `{ id, name, status }` for the current organizer session. Empty list if signed out. | Create estates, list other families |
| `describe_invite_flow` | All pages | Copy of the in-product invite steps (add person → copy private link → optional Send tap) | Send email, create members |
| `get_estate_summary` | Estate views (`/admin`, `/draft`, `/draft-master`, `/results`, `/lottery`) | Item count, picked count, member count, draft progress for a session-visible estate | Private notes, item descriptions, emails, PINs, share tokens |
| `prepare_invite` | Estate views | Opens the existing **Add Family Member** dialog and may prefill name/email | Add a member, send email, copy a link, charge a card |

Not registered (on purpose): anything that sends invites, starts Stripe checkout,
deletes an estate, wipes items, or mutates sensitive data without the existing
UI confirmation path.

## How to test

1. Chrome 149+ with the [WebMCP origin trial](https://developer.chrome.com/docs/ai/webmcp) enabled (or a Chrome build that exposes `document.modelContext`).
2. Install the [Model Context Tool Inspector](https://developer.chrome.com/docs/ai/webmcp) extension.
3. Open a preview of this branch (or `npm run dev` locally) over **HTTPS** (WebMCP requires a secure context).
4. Landing (`/`): inspector should show `list_estates` and `describe_invite_flow` only. Call `list_estates` while signed out — expect `estates: []`.
5. Sign in, open `/admin`: `get_estate_summary` and `prepare_invite` should appear. Call `get_estate_summary` — expect counts, not emails or item notes. Call `prepare_invite` — the Add Family Member dialog opens; nothing is emailed until you tap **Send** yourself.
6. In a browser without WebMCP: the site behaves as before. Check the console for no `modelContext` errors.

Count-only summaries (no emails, notes, or tokens) can also be checked with:

```bash
npx tsx script/webmcp-safety.ts
```

To enroll a deployed origin, add the trial token Chrome issues for that origin as
`<meta http-equiv="origin-trial" content="…">` in `client/index.html`. This spike
does not ship a token.

## Safety boundaries

- Feature-detect only. No polyfill. No invented product claims.
- Tools read `/api/auth/me`, `/api/items`, `/api/siblings`, and `/api/draft` after a session check. Summaries strip descriptions, emails, PINs, and share tokens.
- `prepare_invite` only calls the in-page dialog opener. It does not `POST /api/siblings/:id/invite` or `invite-all`.
- Grief-sensitive: no fake testimonials, no people photos, no tools that surprise a family with mail or charges.
