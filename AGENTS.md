<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## Backend

The backend is the user's own Supabase project (`flight-price-notifier-001`,
ref `mmcgxlcptlwxpskwoomb`). The browser client lives in
`src/integrations/supabase/client.ts` and reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. Never put a secret (`sb_secret_*`,
service-role) key in the repo or in browser code.

<!-- LOVABLE:END -->

- Backend auth is used for sign-in only (built-in users table); app data will live outside it, so do not add custom tables, profiles, or RPCs. Why: product architecture keeps app data in a separate backend.
