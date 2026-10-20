# Brain Battle 🧠

A responsive browser-based quiz game built with React, TypeScript, Vite, and Supabase.

## Features
- Multiple-choice quiz rounds, points, explanations, and end-of-round stats
- Science, Technology, General Knowledge, Sports, and History categories
- Original synthesized background music using the Web Audio API (no external audio assets required)
- Music toggle, answer sound effects toggle, and volume control
- Responsive UI for desktop and mobile browsers
- Optional Supabase question loading and signed-in result saving

## Run locally
1. Install Node.js (LTS).
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key.
4. Start the dev server: `npm run dev`
5. Build for production: `npm run build`

Without Supabase environment variables, the game runs with its bundled sample questions.

## Supabase
For a fresh Supabase project, run `supabase/schema.sql` in the Supabase SQL Editor. The connected Brain-Battle project already has the tables and starter questions. Keep service-role or secret keys out of browser code and never commit them. Only use the publishable key in `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Current MVP notes
- Background music is synthesized in-browser so it can be used without downloading copyrighted music files.
- The first version includes sample questions. A future iteration can add authentication screens, profile management, admin question editing, and real-time multiplayer.
