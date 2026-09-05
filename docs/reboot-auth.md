# Reboot — auth, decided

**The floor server stays the identity authority.** Every FounderFloor account
already lives in `server/floor-data.json` with a scrypt hash, and Supabase
Auth cannot import scrypt hashes. Forcing a password reset on every founder,
including the Product Hunt cohort, to move them into Supabase Auth would cost
real users for no product gain. So:

1. The app signs in against the floor server exactly as the site does
   (`POST /auth/login` with email + password) and keeps the bearer token in
   the keychain (`apps/mobile/src/lib/store.ts`). **This works today** — it
   is what Gate 2's "I sign in and see my real stand" runs on.
2. For Supabase, the floor server gains one route, `POST /auth/supabase`:
   given a valid floor token it mints a JWT signed with `SUPABASE_JWT_SECRET`
   (`sub` = the floor account id, `role` = `authenticated`, `exp` = 1 h).
   The app sends that JWT to PostgREST and the Edge Functions. RLS policies
   compare `auth.jwt() ->> 'sub'` to `owner_id`, so no user table is copied.
3. Supabase Auth's own sign-up stays disabled (`supabase/config.toml`).

What this costs: ~40 lines on the floor server, one secret on the VPS.
What it avoids: a migration, a reset email to every account, two sources of
truth for "who is this".

Status: step 1 shipped. Step 2 is the first item of Gate 2b once the
Supabase project exists and its JWT secret is on the VPS.
