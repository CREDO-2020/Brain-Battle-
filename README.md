# Brain Battle 🧠

A responsive quiz game built with React, TypeScript, Vite, and Supabase.

## Features
- Timed multiple-choice quiz rounds with a 15-second countdown per question
- Science, Technology, General Knowledge, Sports, and History categories
- Points, answer explanations, and end-of-round stats
- Original synthesized background music, answer sound effects, and volume controls
- Email/password sign-up and sign-in through Supabase Auth
- Player profiles and a live leaderboard backed by Supabase
- Responsive desktop and mobile interface
- GitHub Actions production build check on pushes to `main`

## Run locally
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
5. Run `npm run dev`.
6. Run `npm run build` to verify the production build.

Without Supabase environment variables, the game uses bundled sample questions. Accounts, saved scores, and the live leaderboard require Supabase configuration.

## Supabase
The connected Brain Battle project has the `questions`, `quiz_attempts`, and `profiles` tables, plus the `leaderboard` view and a profile-creation trigger. Starter questions are seeded in the connected project.

For a fresh project, `supabase/schema.sql` documents the core question and attempt schema. Apply the profile/leaderboard setup as well before enabling those features. Keep service-role or secret keys out of browser code and never commit them; only use the publishable key in `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Notes
- The background soundtrack is synthesized in the browser, so no audio files need to be downloaded.
- Quiz scores are saved when a player is signed in.
- The app has not yet been deployed to a public production URL.
