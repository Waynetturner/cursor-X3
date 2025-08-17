"use client";
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';

export default function ManualPage() {
  return (
    <AppLayout title="User Manual">
      <div className="prose prose-invert max-w-none px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">User Manual</h1>
        <p className="text-sm text-gray-400 mb-8">This in-app manual summarizes the current feature set. For a richer formatted version see <code>docs/USER_MANUAL.md</code> in the repo.</p>

        <ManualSection id="accounts" title="1. Accounts & Access">
          <p>Sign in with your email. If redirected to sign in again your session expired. Profile data combines two tables: <code>profiles</code> and <code>user_demographics</code>.</p>
        </ManualSection>

        <ManualSection id="program" title="2. Program Structure">
          <p>Push / Pull alternates with a Rest day after every 6 training sessions. The app counts completed workouts since last Rest/missed day to pick today&apos;s slot.</p>
        </ManualSection>

        <ManualSection id="workouts" title="3. Workouts & Exercises">
          <ul>
            <li>Exercises load by workout type (Push or Pull).</li>
            <li>Recent history determines default band & reps context.</li>
            <li>Saving the final exercise marks the day complete.</li>
          </ul>
        </ManualSection>

        <ManualSection id="tts" title="4. Text-to-Speech (TTS)">
          <p>TTS provides exercise transition and completion cues. Configure under Settings → Preferences. Premium voices require Mastery.</p>
        </ManualSection>

        <ManualSection id="tiers" title="5. Subscription Tiers">
          <p>Tiers unlock features like TTS, rest timer, analytics, export, premium voices. Set under Settings → Subscription (stored locally during MVP).</p>
        </ManualSection>

        <ManualSection id="calendar" title="6. Calendar & History">
          <p>The calendar shows completed workout types and upcoming schedule slots based on dynamic calculation.</p>
        </ManualSection>

        <ManualSection id="stats" title="7. Stats & Analytics">
          <p>Stats page surfaces progression; advanced analytics require higher tier.</p>
        </ManualSection>

        <ManualSection id="test-mode" title="8. Test Mode">
          <p>Developer test mode can mock subscription and workout data; available to Mastery tier under Advanced Settings.</p>
        </ManualSection>

        <ManualSection id="accessibility" title="9. Accessibility">
          <p>Screen reader announcements supplement TTS. Key state changes are announced for inclusivity.</p>
        </ManualSection>

        <ManualSection id="data" title="10. Data Model (Simplified)">
          <ul>
            <li><code>profiles</code>: start date, identity.</li>
            <li><code>user_demographics</code>: background & preferences.</li>
            <li><code>daily_workout_log</code>: daily workout / rest markers.</li>
            <li><code>workout_exercises</code>: per-exercise performance.</li>
          </ul>
        </ManualSection>

        <ManualSection id="scenarios" title="11. Common Scenarios">
          <ul>
            <li>Upgrade plan: Settings → Subscription.</li>
            <li>Configure voices: Settings → Preferences.</li>
            <li>Dark mode: Settings → Preferences.</li>
            <li>View schedule: Calendar page.</li>
          </ul>
        </ManualSection>

        <ManualSection id="troubleshooting" title="12. Troubleshooting">
          <ul>
            <li>Wrong workout type: verify yesterday was saved as completed.</li>
            <li>No TTS: check tier & browser speech permissions.</li>
            <li>No rest timer: requires Momentum or Mastery.</li>
            <li>Upgrade not reflected: reload (localStorage tier persistence).</li>
          </ul>
        </ManualSection>

        <ManualSection id="privacy" title="13. Privacy & Local Data">
          <p>During MVP, subscription tier, test mode, and some preferences are client-side; workout data persists in Supabase.</p>
        </ManualSection>

        <hr className="my-10" />
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><Link href="/workout" className="text-orange-400 hover:underline">Workout</Link></li>
          <li><Link href="/calendar" className="text-orange-400 hover:underline">Calendar</Link></li>
          <li><Link href="/stats" className="text-orange-400 hover:underline">Stats</Link></li>
          <li><Link href="/settings" className="text-orange-400 hover:underline">Settings</Link></li>
        </ul>
        <p className="text-xs text-gray-500 mt-8">Manual version 1.0 – update as features evolve.</p>
      </div>
    </AppLayout>
  );
}

function ManualSection({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <div className="text-gray-300 leading-relaxed text-sm">
        {children}
      </div>
    </section>
  );
}
