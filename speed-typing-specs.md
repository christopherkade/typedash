# Project Specification: Daily Type Dash

A minimalist, high-polish daily typing speed game.

## 1. Overview
Daily Type Dash is a web-based typing game where players compete to type a 50-word "Sentence of the Day" as fast as possible. The game focuses on a sleek, distraction-free UI with a focus on typography and smooth movement.

## 2. Tech Stack
- **Framework:** Next.js (App Router)
- **Database/Backend:** Supabase (PostgreSQL + Real-time)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion (for the smooth sentence scrolling)
- **Deployment:** Vercel

## 3. Core Mechanics

### 3.1 The Daily Sentence
- A new sentence is generated or fetched every day at 00:00 UTC.
- **Length:** Approximately 50 words (~250-300 characters).
- **Persistence:** The sentence is stored in a `daily_sentences` table in Supabase.

### 3.2 Gameplay
- **Limit:** 5 retries per user per day.
- **Input:** The user types into a hidden input or a focused window.
- **Strict Mode:** Users cannot move past a character until it is typed correctly.
- **Movement:** The "Active Word" is always horizontally centered. As the user types, the entire sentence container shifts left.

### 3.3 Scoring
- **WPM (Words Per Minute):** Calculated as `(Characters / 5) / (Time in Minutes)`.
- **Accuracy:** Percentage of correct keystrokes vs total keystrokes.
- **Time:** Total seconds taken to complete the sentence (to three decimal places).

## 4. UI/UX Design (The "Polished" Look)

### 4.1 Visual Theme
- **Background:** Deep Matte Black (`#0a0a0a`).
- **Typography:** - **Font:** Large (approx. 32px - 48px), polished Sans-serif (Inter or Geist).
    - **Untyped Text:** Low opacity (e.g., `text-white/20`).
    - **Typed Text:** High contrast (`text-white`).
    - **Active Word:** Slightly highlighted or underlined.

### 4.2 The "Center-Focus" Viewport
- The sentence is a single horizontal line.
- The viewport is the full width of the screen.
- A vertical "cursor" line or a subtle highlight box remains fixed in the center of the screen.
- The sentence container translates leftward based on the width of the characters already typed.

## 5. Database Schema (Supabase)

### 5.1 `daily_sentences`
- `id`: uuid (PK)
- `date`: date (unique)
- `content`: text

### 5.2 `leaderboard`
- `id`: uuid (PK)
- `username`: varchar(25)
- `wpm`: float8
- `time_seconds`: float8
- `accuracy`: float4
- `sentence_id`: uuid (FK to daily_sentences)
- `created_at`: timestamp

## 6. Game Flow
1. **Landing:** User sees the current attempt count (e.g., "Attempt 1/5").
2. **Start:** Game begins on the first keystroke. Timer starts.
3. **Typing:** Sentence moves left smoothly. Visual feedback on correct/incorrect keys.
4. **Finish:** - Timer stops. 
    - A modal/dialog appears with:
        - Time (s)
        - WPM
        - Accuracy
    - If it's a top 10 score, the user is prompted to save their name.
5. **Leaderboard:** Display the top 10 players for the current `sentence_id` sorted by `wpm` DESC.

## 7. Future Considerations (V2)
- Sound effects for mechanical keyboard clicks.
- Ghost mode: see a shadow of the top player's progress as you type.
- Share button: "I typed today's sentence in 24.5s (110 WPM) #DailyTypeDash".
