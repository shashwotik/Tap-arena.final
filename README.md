# Tap Legends

A premium, competitive, mobile-first tapping game. Tap to climb a 10-tier rank
ladder, battle strangers in live 60-second 1v1 matches, and chase the top of a
global leaderboard — all wrapped in a dark, neon-blue, glass-and-glow interface
built for touch.

![stack](https://img.shields.io/badge/React-19-149eca) ![stack](https://img.shields.io/badge/TypeScript-5-3178c6) ![stack](https://img.shields.io/badge/Tailwind-4-38bdf8) ![stack](https://img.shields.io/badge/Firebase-12-ffca28)

## Features

- **Tap circle** — perfect circle, glowing neon border, ambient pulse, a
  rotating radar-sweep ring + sonar ping (the game's signature visual
  device), particle bursts on every tap, press-scale feedback.
- **10-level rank ladder**, Bronze I → Legendary, with an animated progress
  bar and a level-up modal (animation + sound + haptics).
- **Live global leaderboard**, top 100, auto-updating in real time.
- **Online 1v1 matches** — real matchmaking queue, 3-2-1-GO countdown,
  60-second synced timer, live opponent taps, win/loss rewards, match
  history. Includes an AI practice-match fallback if no opponent is found.
- **Full profile** — level, total taps, highest TPS, wins/losses/win
  rate/matches played, join date, country.
- **Flex Money** — a pure display stat (1,000 taps = $1), clearly labeled as
  non-redeemable.
- **Settings** — sound, vibration, language (English / Español / বাংলা,
  easily extensible), dark/light theme (dark is default).
- **Anti-cheat** — client-side auto-clicker/TPS/robotic-pattern detection,
  bounded server-side writes, an admin review queue, and an optional
  Cloud Functions hardening layer. See [Anti-cheat design](#anti-cheat-design).

## Tech stack

React 19 · TypeScript · Tailwind CSS v4 · Motion (Framer Motion) · Firebase
(Authentication, Firestore, Realtime Database) · Vite · lucide-react.

## Project structure

```
tap-legends/
├── firestore.rules            # Firestore security rules
├── database.rules.json        # Realtime Database security rules
├── firebase.json              # Firebase CLI config
├── functions/                 # OPTIONAL hardened Cloud Functions
│   └── src/index.ts
├── public/
└── src/
    ├── types/                 # Shared TypeScript types
    ├── config/                 # Levels, constants, i18n, countries
    ├── firebase/               # Thin service layer over the Firebase SDK
    │   ├── config.ts
    │   ├── auth.ts
    │   ├── userService.ts      # Profile, taps, stats, flags, admin actions
    │   ├── leaderboardService.ts
    │   └── matchService.ts     # Matchmaking queue + live match (RTDB)
    ├── context/                 # AuthContext, SettingsContext
    ├── hooks/                   # useAntiCheat, useMatchmaking
    ├── utils/                   # cn, format, soundManager, haptics, anti-cheat engine
    ├── components/
    │   ├── ui/                  # Button, Switch, Modal, BottomNav, ...
    │   ├── tap/                 # TapCircle, ParticleBurst
    │   ├── level/                # LevelProgressBar, LevelUpModal
    │   ├── match/                 # Matchmaking/Countdown/LiveMatch/Result
    │   └── admin/
    └── screens/                  # One component per screen
```

## Getting started

**Prerequisites:** Node.js ≥ 20.19, a free [Firebase](https://console.firebase.google.com)
project.

```bash
npm install
cp .env.example .env
```

### 1. Create a Firebase project

In the [Firebase console](https://console.firebase.google.com): **Add
project** → give it a name → (Google Analytics is optional, skip it if you
want the fastest setup).

### 2. Register a Web app

Project settings (gear icon) → **Your apps** → **Web** (`</>`) → register the
app → copy the `firebaseConfig` values into `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Enable Authentication

**Build → Authentication → Get started**, then enable the **Anonymous** and
**Email/Password** sign-in providers (both are used by the Auth screen's
"Continue as Guest" and email flows).

### 4. Create Firestore

**Build → Firestore Database → Create database** (production mode is fine —
the rules in `firestore.rules` handle access control). Note the database's
region; it doesn't need to match anything else.

### 5. Create Realtime Database

**Build → Realtime Database → Create database**. Copy the database URL
(looks like `https://<project-id>-default-rtdb.<region>.firebasedatabase.app`)
into `VITE_FIREBASE_DATABASE_URL` in `.env`.

### 6. Deploy the security rules

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
firebase use --add               # pick your project
firebase deploy --only firestore:rules,database
```

You can also paste the contents of `firestore.rules` / `database.rules.json`
directly into the console's Rules tabs if you'd rather not install the CLI.

### 7. Run it

```bash
npm run dev
```

If `.env` isn't filled in yet, the app still loads and shows a banner
telling you so, rather than failing silently.

## Anti-cheat design

Detection lives in `utils/antiCheatEngine.ts` and runs on **every** tap,
whether it happens on the Home screen or inside a live match:

- **`event.isTrusted`** — script-dispatched taps aren't real pointer events;
  this is the single strongest signal available client-side.
- **Page Visibility** — taps registered while the tab is hidden can't come
  from a person looking at the screen.
- **Instantaneous TPS ceiling** and **sustained-rate ceiling** — tuned
  around realistic human tapping limits.
- **Interval-variance check** — real taps have irregular spacing; a
  near-zero standard deviation between taps looks scripted.

Flags are **advisory, not punitive** — they raise a `suspicionScore` and
surface the account in **Settings → Admin Panel** (visible only if
`isAdmin: true` on your Firestore user doc) for a human to dismiss, reset, or
ban. Nothing here auto-restricts a fast-but-legitimate player.

Server-side, `firestore.rules` caps any single write to `totalTaps` at +200
and requires every self-update to go through the owning user's auth — a
modified or replayed client request can't hand itself an arbitrary tap count.

### Cloud Functions hardening (optional)

`/functions` contains two callable functions that move the highest-value
checks server-side:

- **`submitTapBatch`** — a sequence number makes replayed batches a no-op,
  and implausible rates get flagged even if a modified client skipped local
  detection entirely.
- **`finalizeMatch`** — reads both players' final tap counts with the Admin
  SDK (which bypasses Realtime Database rules), so match rewards never
  depend on trusting either client's report of the result.

These are **not required** to run or play the game — everything works
against Auth + Firestore + Realtime Database alone. To deploy them:

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

Then wire `VITE_USE_CLOUD_FUNCTIONS=true` and call these functions from
`userService`/`matchService` in place of the direct Firestore/RTDB writes —
left as an integration point rather than a hard dependency, since Cloud
Functions require Firebase's pay-as-you-go (Blaze) plan.

## Becoming an admin

There's deliberately no in-app way to grant yourself admin (see
`firestore.rules` — `isAdmin` can't be set at signup or via a normal
self-update). To make an account an admin, open that user's document in the
Firestore console (`users/<uid>`) and set `isAdmin: true` by hand, or via a
trusted server-side script using the Admin SDK.

## Customizing

- **Levels/thresholds** — `src/config/levels.ts`.
- **Match rules & rewards** — `src/config/constants.ts`.
- **Colors, glows, fonts** — the `@theme` block in `src/index.css` (Tailwind
  v4's CSS-first config — no `tailwind.config.js` needed). Light theme is a
  variable override in the same file.
- **Languages** — `src/config/i18n.ts`. Add a language by adding one more
  dictionary object and an entry in `LANGUAGES`; missing keys fall back to
  English automatically.

## Known limitations

Being upfront about where this starting point simplifies things, and how to
close each gap:

- **Matchmaking pairing** uses a lightweight client-side rule (the
  lexicographically-smallest waiting uid creates the match) rather than a
  server-side matchmaker. It's race-free by construction for the common
  case, but a fully trustless deployment at scale should move pairing into
  a Cloud Function.
- **Live match tap counts** are written by each client to its own Realtime
  Database path; `database.rules.json` restricts a match to its two
  participants but can't fully stop a participant from directly calling the
  RTDB API to misreport their *own* tap count within a match (the flat
  ±1000/2000 reward and Firestore-side bounded increments limit the payoff
  of doing so). `finalizeMatch` in `/functions` closes this gap by making
  match resolution server-authoritative.
- **Navigating away mid-match** isn't specially recovered — the in-progress
  match hook unmounts. The opponent's abandonment-grace-period (9s after
  they finish) still resolves the match on their side.

## License

Built for your own project — customize freely.
