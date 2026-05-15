# Plan: Daily Type Dash — V1 Implementation

Implement the frontend typing game with center-focus scrolling UI, scoring, and localStorage-based retry tracking. Supabase/leaderboard integration deferred to a follow-up phase.

## Decisions

- **Scope**: UI/Game first, Supabase later
- **Sentences**: Static JSON file, deterministic daily pick based on UTC date
- **Retries**: localStorage (5/day), keyed by date
- **Leaderboard**: Deferred (requires Supabase)
- **Tailwind**: v4 with CSS-first config (`@tailwindcss/postcss`)
- **Animations**: Framer Motion for sentence translation
- **Font**: Geist (already configured in layout.tsx)

---

## Phase 1: Project Setup

1. Install dependencies: `tailwindcss`, `@tailwindcss/postcss`, `framer-motion`
2. Create `postcss.config.mjs` with `@tailwindcss/postcss` plugin
3. Replace `app/globals.css` with Tailwind v4 import (`@import 'tailwindcss'`) + custom theme tokens (background `#0a0a0a`, foreground white)
4. Update `app/layout.tsx`: metadata title/description to "Daily Type Dash", set dark background and white text on `<body>`
5. Delete `app/page.module.css` (switching to Tailwind utility classes)

**Files**: `postcss.config.mjs` (new), `app/globals.css`, `app/layout.tsx`, `app/page.module.css` (delete)

---

## Phase 2: Static Data & Utilities

6. Create `data/sentences.json` — array of ~30 sentences (~50 words / 250–300 chars each)
7. Create `lib/get-daily-sentence.ts` — picks today's sentence deterministically: `sentences[daysSinceEpoch % sentences.length]`, returns `{ id: string, content: string }`
8. Create `lib/scoring.ts` — exports:
   - `calculateWPM(charCount, timeMs)` → `(chars / 5) / (timeMs / 60000)`
   - `calculateAccuracy(correctKeystrokes, totalKeystrokes)` → percentage
   - `formatTime(timeMs)` → seconds to 3 decimal places
9. Create `lib/attempts.ts` — localStorage helper:
   - `getAttemptsToday(): number`
   - `incrementAttempt(): void`
   - `hasAttemptsRemaining(): boolean`
   - Key format: `dtd-attempts-YYYY-MM-DD`

**Files**: `data/sentences.json` (new), `lib/get-daily-sentence.ts` (new), `lib/scoring.ts` (new), `lib/attempts.ts` (new)

---

## Phase 3: Core Game Engine *(depends on Phase 2)*

10. Create `components/TypingGame.tsx` (`'use client'`) — the main game component:
    - **State**: `currentIndex` (char position), `startTime`, `isFinished`, `totalKeystrokes`, `correctKeystrokes`
    - **Hidden input**: auto-focused `<input>` that captures keystrokes via `onKeyDown`
    - **Strict mode**: on each keystroke, compare against `sentence[currentIndex]`. If correct, advance `currentIndex` and increment `correctKeystrokes`. Always increment `totalKeystrokes`.
    - **Timer**: set `startTime = Date.now()` on first correct keystroke. On last char typed, compute elapsed time.
    - **Completion**: when `currentIndex === sentence.length`, set `isFinished = true`, compute scores

**Files**: `components/TypingGame.tsx` (new)

---

## Phase 4: Center-Focus UI *(built inside Phase 3 component)*

11. Build the sentence display inside `TypingGame.tsx`:
    - Render each character as a `<span>` with conditional classes:
      - Typed (index < currentIndex): `text-white`
      - Active char (index === currentIndex): highlighted with a subtle underline or background
      - Untyped (index > currentIndex): `text-white/20`
    - Wrap all characters in a Framer Motion `<motion.div>` container
    - Compute `translateX` based on measured width of typed characters using a ref + `getBoundingClientRect`
    - Animate with `animate={{ x: -offset }}` and a spring/tween transition
12. Add a fixed center cursor indicator — a subtle vertical line fixed at `left: 50%` of the viewport
13. Style: full-width viewport, vertically centered, overflow hidden, large font (text-4xl–text-5xl, Geist)

**Files**: `components/TypingGame.tsx`

---

## Phase 5: Results & Game Flow *(depends on Phase 3)*

14. Create `components/ResultsModal.tsx` (`'use client'`) — displays after completion:
    - Time (seconds, 3 decimal places), WPM, Accuracy %
    - "Try Again" button (if attempts remaining)
    - Shows current attempt count
    - Framer Motion enter/exit animation
15. Create `components/AttemptCounter.tsx` — displays "Attempt X/5"
16. Wire up `app/page.tsx`:
    - Server component that reads today's sentence from `lib/get-daily-sentence.ts`
    - Passes sentence to `<TypingGame>` client component
    - Layout: attempt counter at top, typing game centered, results modal overlay

**Files**: `components/ResultsModal.tsx` (new), `components/AttemptCounter.tsx` (new), `app/page.tsx`

---

## File Checklist

| File | Action |
|------|--------|
| `postcss.config.mjs` | Create |
| `app/globals.css` | Replace |
| `app/layout.tsx` | Modify |
| `app/page.module.css` | Delete |
| `data/sentences.json` | Create |
| `lib/get-daily-sentence.ts` | Create |
| `lib/scoring.ts` | Create |
| `lib/attempts.ts` | Create |
| `components/TypingGame.tsx` | Create |
| `components/ResultsModal.tsx` | Create |
| `components/AttemptCounter.tsx` | Create |
| `app/page.tsx` | Replace |

---

## Verification

1. `pnpm build` — compiles without errors
2. `pnpm dev` — manual testing:
   - Page loads with today's sentence in low-opacity text
   - First keystroke starts the timer
   - Correct keystrokes advance cursor; sentence scrolls left smoothly
   - Wrong keystrokes blocked (strict mode) but counted toward total
   - Completing the sentence shows results modal with correct WPM/accuracy/time
   - After 5 attempts, game shows "no attempts remaining"
   - Next UTC day resets the attempt counter
3. `pnpm lint` — no lint errors

---

## Future Phase (Supabase Integration)

- Install `@supabase/supabase-js`, configure `.env.local`
- Create `lib/supabase.ts` client
- Replace static JSON sentences with DB fetch from `daily_sentences` table
- Add leaderboard: save scores to `leaderboard` table, display top 10
- Username prompt when score qualifies for top 10
