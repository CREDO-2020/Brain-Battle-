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
- GitHub Actions build checks and GitHub Pages deployment

## Run locally
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
5. Run `npm run dev`.
6. Run `npm run build` to verify the production build.

Without Supabase environment variables, the game uses bundled sample questions. Accounts, saved scores, and the live leaderboard require Supabase configuration.

## Supabase setup
For a fresh Supabase project, open the SQL Editor and run these files in order:
1. `supabase/schema.sql` — creates the questions and quiz attempts tables and seeds sample questions.
2. `supabase/profiles_leaderboard.sql` — creates player profiles, the profile-creation trigger, and the leaderboard view.

The connected Brain Battle project already has the `questions`, `quiz_attempts`, and `profiles` tables, plus the `leaderboard` view and a profile-creation trigger. Starter questions are seeded there.

In Supabase Authentication settings, configure the site's allowed redirect URLs for your local and deployed app. Keep service-role or secret keys out of browser code and never commit them; the frontend must only use the publishable key.

## Deploy to GitHub Pages
A workflow at `.github/workflows/deploy.yml` builds and deploys the app whenever code is pushed to `main`.

1. Open the repository's **Settings → Secrets and variables → Actions**.
2. Add repository secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the values from Supabase Project Settings → API.
3. Open **Settings → Pages** and set the build/deployment source to **GitHub Actions**.
4. Push to `main`, or manually run **Deploy Brain Battle to GitHub Pages** from the **Actions** tab.
5. When the deployment workflow succeeds, open the published Pages URL shown in the workflow's deployment environment.
6. In Supabase Authentication URL Configuration, add the published URL to the allowed redirect URLs.

The public Pages site can build without those secrets, but account sign-in, saved scores, and the live leaderboard will not work until they are configured. Do not use a Supabase service-role key here.

## Notes
- The background soundtrack is synthesized in the browser, so no audio files need to be downloaded.
- Quiz scores are saved when a player is signed in.
