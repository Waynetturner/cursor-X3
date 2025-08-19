# X3 Momentum Pro – User Manual

Welcome to X3 Momentum Pro. This guide explains how to use every core feature currently implemented in the app. It reflects the live codebase (workout logic, subscription tiers, TTS, rest timer, test mode, data logging, and settings).

---
## 1. Accounts & Access
### 1.1 Authentication
Sign up or sign in with email. If you get redirected to `/auth/signin`, your Supabase session expired—log in again.

### 1.2 Profile Data
Stored across two tables:
- `profiles`: basic identity + `x3_start_date` (used to calculate program week).
- `user_demographics`: training background & preferences.

You can edit these in Settings → Profile. The app combines both when showing your profile form.

---
## 2. Program Structure
The training pattern cycles Push / Pull with a Rest day after each 6-session block. Current logic (see `daily-workout-log.ts`):

Week Schedule Sets:
- Weeks 1–4: `['Push','Pull','Rest','Push','Pull','Rest','Rest']`
- Weeks 5+: `['Push','Pull','Rest','Push','Pull','Rest']` (6-day cycle)

Notes:
- Rest days ARE part of the streak (they count toward consecutive adherence) but are NOT counted in workout totals / completed-this-week metrics which track active Push/Pull sessions only.

Determining Today:
1. Fetch recent completed workouts.
2. Count sessions since the last Rest/missed day.
3. Next index = (count % schedule length).
4. That schedule slot becomes today’s workout type (or Rest).

This guarantees it advances predictably even if you miss or duplicate days.

---
## 3. Workouts & Exercises
### 3.1 Workout Page
When a workout (Push or Pull) is scheduled today:
- Exercises are loaded by type from `X3_EXERCISES` (Supabase helper).
- Recent performance per exercise is queried (`exercise-history.ts`).
- Cards show: exercise name, band color, full reps, partial reps.

### 3.2 Logging Sets
For each exercise:
1. Enter reps & (if applicable) adjust band.
2. Save → Inserts or upserts into workout exercise table.
3. On completion of all exercises, the daily log entry is marked completed.

### 3.3 Band Hierarchy
Recent band choice is reused unless logic escalates/downgrades (placeholder logic awaiting progression rules).

### 3.4 Rest Timer
If enabled by subscription (`restTimer` feature), a 90‑second timer starts between exercises (not after final one).

---
## 4. Text‑to‑Speech (TTS)
Features gated by tier (`ttsAudioCues`).

Used for:
- Exercise transition cues.
- Workout completion phrase (context aware: last exercise vs middle).
- (Future) AI coach or analytics narration.

Configure: Settings → Preferences → Text‑to‑Speech Settings.

Mastery tier may show “Premium Voices” label; other paid tier shows “Standard Voices”.

---
## 5. Subscription Tiers
Defined in `SubscriptionContext`:
- Foundation: Core tracking only.
- Momentum: Adds TTS, rest timer, analytics, AI coach access (where implemented), export.
- Mastery: Momentum + premium voices, unlimited history, priority/API placeholders.

Tier Persistence: stored in `localStorage` key `x3-subscription-tier` until a real billing backend is integrated.

Upgrade: Settings → Subscription tab.

---
## 6. Calendar & History
Calendar page (`/calendar`):
- Displays scheduled vs completed types per day.
- Uses workout log + dynamic calculation for upcoming days.
- Color/label differences for Push, Pull, Rest, Missed.

History Queries: Each exercise fetch pulls recent rows, sorted by date, to set default display values for today.

---
## 7. Stats & Analytics
Stats page (`/stats`) summarizes progression (implementation evolving). Feature richness depends on tier (`advancedAnalytics`).

---
## 8. Test Mode (Developer / QA)
`testModeService` can:
- Mock subscription tier (forces Mastery during tests).
- Mock workouts / TTS responses.
- Provide visual indicator if enabled.

Access: Settings → Advanced (Mastery tier) → Developer Test Mode.

Use this for safe experimentation without polluting real progress.

---
## 9. Accessibility
The app uses `announceToScreenReader` for key context (welcome, workout readiness). TTS cues supplement but do not replace ARIA-friendly announcements.

---
## 10. Front-End Data Concepts
You’ll see a few key objects in the UI (internal storage details hidden on purpose):
- WorkoutInfo: today’s type (Push / Pull / Rest), program week, position in week.
- Exercise Card: name, last band used, full + partial reps you enter, and a quick history preview.
- Stats Summary: current week (schedule-based), streak (includes Rest days), longest streak, totals (Push/Pull only).

Persistence Note: Active session data and historical progress are loaded on demand; local preferences (subscription tier, test mode, appearance, voice settings) live in browser storage.

---
## 11. Common Scenarios
| Goal | Action |
|------|--------|
| Change plan | Settings → Subscription → choose upgrade |
| Adjust TTS voice | Settings → Preferences → Configure Voice Settings |
| Correct a mistaken save | (Future enhancement) – currently re-save with corrected values overwriting same date/time window |
| See next workout | Calendar view or open Workout page day-of |
| Enable dark mode | Settings → Preferences → Appearance toggle |
| Test features safely | Advanced → Developer Test Mode (Mastery) |

---
## 12. Progression & Future Notes
Some areas (auto band progression, AI coaching depth, export, API access) have placeholders or partial logic. Release cadence will expand these features; manual will be updated accordingly.

---
## 13. Troubleshooting
Issue | Suggested Check
----- | ----------------
Wrong workout type shown | Ensure last workout was actually saved (daily log has status `completed`).
TTS not speaking | Confirm tier includes `ttsAudioCues`. Reload page. Check browser voice permissions.
Rest timer missing | Tier must include `restTimer` (Momentum+).
Profile not saving | Open console for Supabase error logs (network / permission issues).
Upgraded but features locked | localStorage may not have updated—reload or reselect plan.

---
## 14. Privacy & Local Data
Subscription tier, test mode, and some UI preferences are local (client-side) during MVP. Core workout data persists in Supabase.

---
## 15. Quick Navigation
Path | Purpose
---- | -------
`/workout` | Perform today’s session
`/calendar` | Monthly schedule & history context
`/stats` | Performance & trends
`/settings` | Account, subscription, preferences
`/manual` | In-app version of this manual

---
### Feedback
Send improvement ideas to the support channel or file an internal issue. This manual evolves with the product.
