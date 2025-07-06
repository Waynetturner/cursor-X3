# X3 Momentum Pro - UI/UX Design Specifications v2.0

## Design Principles (2025 Modern Approach)

### Core Design System
- **Layout**: Bento grid system - clean, compartmentalized sections
- **Color Approach**: Solid colors only (NO gradients or glassmorphism)
- **Card Design**: Material Design principles - solid white backgrounds with subtle shadows
- **Typography**: Bold, large fonts for headers; clean, readable body text
- **Spacing**: Consistent 8px base unit system
- **Accessibility**: High contrast support, keyboard navigation, screen reader optimized
- **Mobile-First**: Primary use case is logging workouts on mobile devices

### Fire Theme Color System
```css
/* Primary Fire Colors */
--fire-orange: #FF6B35;    /* Primary CTAs, progress indicators */
--ember-red: #D32F2F;      /* Urgent actions, intensity indicators */
--flame-gold: #FFC107;     /* Achievements, success states */

/* Supporting Colors */
--charcoal: #212121;       /* Primary text, dark backgrounds */
--dark-gray: #303030;      /* Secondary surfaces */
--pure-white: #FFFFFF;     /* Content backgrounds, contrast text */
--success-green: #4CAF50;  /* Saved states, completed actions */
--warning-amber: #FF9800;  /* Caution states */

/* Semantic Colors */
--background-primary: #FAFAFA;    /* Main app background */
--background-card: #FFFFFF;       /* Card backgrounds */
--border-subtle: #E5E5E5;        /* Card borders */
--text-primary: #212121;         /* Main text */
--text-secondary: #666666;       /* Helper text */
```

## Page Layouts

### 1. Main Workout Dashboard
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Hero Banner (Full Width) ────────────────────────┐ │ ← 80px height
│ │ 🔥 X3 MOMENTUM                            PRO     │ │
│ │ AI-Powered Resistance Band Tracking               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] [⚙️] │ ← Full nav (desktop)
├─────────────────────────────────────────────────────┤   [☰] (mobile)
│ ┌─ Motivational Greeting ───────────────────────────┐ │
│ │ 🌅 Good morning, John!                           │ │
│ │ "Train to failure, not to a number"              │ │
│ │ Week 6 • Today's Pull Workout                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Stats Bento Grid (2x2 mobile, 4x1 desktop) ────┐ │
│ │ ┌─ Fire Streak ─┐  ┌─ Week Progress ─┐ ┌─ Total ┐ │ │
│ │ │ 🔥    7 days  │  │ 📊      65%     │ │ 💪  23 │ │ │
│ │ └───────────────┘  └─────────────────┘ └───────┘ │ │
│ │ ┌─ Strength Gain ─────────────────────────────┐  │ │
│ │ │ ⚡     +12% this month                     │  │ │
│ │ └─────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Cadence Control (Full Width) ────────────────────┐ │
│ │ 🎵 Workout Cadence - Audio metronome for timing  │ │
│ │ [████████████████████████ Start Cadence (1s) ] │ │
│ │ ⏱️ Next exercise in: 90s (when rest timer active) │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Exercise Grid (2x2 mobile, 4x1 desktop) ────────┐ │
│ │ ┌─Deadlift (Current)┐ ┌─Bent Row────┐ ┌─Bicep──┐ │ │
│ │ │🟠Band: Dark Gray  │ │ Band: White │ │Band:LtG│ │ │
│ │ │ Full: [26] ⭐     │ │ Full: [27]  │ │Full:[29│ │ │
│ │ │ Part: [0]        │ │ Part: [3]   │ │Part:[3]│ │ │
│ │ │ Notes: felt good  │ │ Notes: ___  │ │Notes:__│ │ │
│ │ │ [💾 Saved!]      │ │ [💾 Saved!] │ │[💾Save│ │ │
│ │ │ Last: 28+0 reps  │ │ Last: 25+4  │ │Last:26+│ │ │
│ │ └─────────────────┘ └─────────────┘ └───────┘ │ │
│ │ ┌─Calf Raise──────┐                           │ │
│ │ │ Band: Light Gray │                           │ │
│ │ │ Full: [20]       │                           │ │
│ │ │ Part: [0]        │                           │ │
│ │ │ Notes: ___       │                           │ │
│ │ │ [🔥 Save Exercise]│                           │ │
│ │ │ Last: 19+0 reps  │                           │ │
│ │ └─────────────────┘                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ AI Coaching Section (Mastery Tier) ──────────────┐ │
│ │ 🤖 Your AI Coach Says:                           │ │
│ │ "Great energy today! Your deadlift form looked   │ │
│ │ solid. Keep that intensity for bent rows."       │ │
│ │ ┌─ Workout Feedback ─────────────────────────────┐ │ │
│ │ │ Tell me about your energy, form, or challenges │ │ │
│ │ │ [Text area for user response]                  │ │ │
│ │ │ [🎤 Get AI Feedback]                           │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Stats/Progress Page
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Hero Banner ──────────────────────────────────────┐ │
│ │ 🔥 X3 MOMENTUM                            PRO     │ │
│ │ AI-Powered Resistance Band Tracking               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] [⚙️] │
├─────────────────────────────────────────────────────┤
│ ┌─ Progress Overview Bento Grid ────────────────────┐ │
│ │ ┌─ This Week ──────┐  ┌─ This Month ──────────┐ │ │
│ │ │ 🎯 4/6 workouts  │  │ 📈 +47% avg strength  │ │ │
│ │ │ 2 days remaining │  │ 158 total reps today │ │ │
│ │ └──────────────────┘  └───────────────────────┘ │ │
│ │ ┌─ Personal Bests ─┐  ┌─ Consistency ────────┐ │ │
│ │ │ 🏆 12 this month │  │ 🔥 86% (6 weeks)     │ │ │
│ │ │ 3 today! ✨      │  │ Current: 7 day streak│ │ │
│ │ └──────────────────┘  └───────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Interactive Progress Chart ──────────────────────┐ │
│ │ 📊 Exercise Progression - Last 6 Workouts        │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │    [Interactive bar chart showing:         │ │ │
│ │ │     - Deadlift: 28→26→30→28→31→26 reps    │ │ │
│ │ │     - Bent Row: 25→27→24→26→25→27 reps    │ │ │
│ │ │     - Bicep Curl: 26→29→28→30→27→29 reps  │ │ │
│ │ │     - Calf Raise: 19→20→18→21→20→20 reps] │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Band Progression Intelligence ────────────────────┐ │
│ │ ┌─ Ready to Advance ──────────────────────────────┐ │ │
│ │ │ 🟢 Deadlift: 40+ reps achieved → Dark Gray     │ │ │
│ │ │ 🟡 Bicep Curl: Building (29 reps) → Stay White │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Recent Workout History ───────────────────────────┐ │
│ │ ┌─ Jan 3 - Pull Workout ─────────────────────────┐ │ │
│ │ │ Deadlift: 26+0 (Dark Gray) Duration: 12 min   │ │ │
│ │ │ Bent Row: 27+3 (White) ✨ Personal Best!      │ │ │
│ │ │ Bicep Curl: 29+3 (White) Strong performance   │ │ │
│ │ │ Calf Raise: 20+0 (Light Gray) Consistent      │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3. Goals Page
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Hero Banner ──────────────────────────────────────┐ │
│ │ 🔥 X3 MOMENTUM                            PRO     │ │
│ │ AI-Powered Resistance Band Tracking               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] [⚙️] │
├─────────────────────────────────────────────────────┤
│ ┌─ Personal Mission Statement ───────────────────────┐ │
│ │ 🎯 Your 12-Week Transformation                    │ │
│ │                                                   │ │
│ │ "I am transforming my body and mind through       │ │
│ │ consistent X3 training. Each workout brings me    │ │
│ │ closer to feeling confident, strong, and          │ │
│ │ energized in everything I do. I'm building the    │ │
│ │ lean, powerful physique I've always wanted while  │ │
│ │ proving to myself that I can commit to and        │ │
│ │ achieve my goals."                                │ │
│ │                                                   │ │
│ │ Generated from your onboarding: "I want to build  │ │
│ │ muscle, feel more confident, and prove I can      │ │
│ │ stick to something"                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ 12-Week Targets Bento Grid ──────────────────────┐ │
│ │ ┌─ Strength Goal ──┐  ┌─ Consistency Goal ──────┐ │ │
│ │ │ 💪 +50% strength │  │ 🔥 80% weekly adherence │ │ │
│ │ │ Current: +47%    │  │ Current: 86% ✅         │ │ │
│ │ └──────────────────┘  └─────────────────────────┘ │ │
│ │ ┌─ Progression Goal ┐  ┌─ Mindset Goal ─────────┐ │ │
│ │ │ 🎯 Advance 2 bands│  │ 🧠 Train to failure    │ │ │
│ │ │ Progress: 1/2 ✨  │  │ Mental toughness: 8/10 │ │ │
│ │ └──────────────────┘  └─────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Weekly Focus ─────────────────────────────────────┐ │
│ │ Week 6 Focus: "Intensive Phase Mastery"           │ │
│ │                                                   │ │
│ │ This week you're deepening your training          │ │
│ │ intensity. Focus on:                              │ │
│ │ • Pushing to true failure on every set           │ │
│ │ • Maintaining form even when fatigued            │ │
│ │ • Celebrating small improvements in reps         │ │
│ │ • Building mental resilience                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Daily Affirmations ───────────────────────────────┐ │
│ │ Today's Affirmation:                              │ │
│ │ "I embrace the challenge of training to failure.  │ │
│ │ Each difficult rep builds both my body and my     │ │
│ │ character. I am stronger than I was yesterday."   │ │
│ │                                                   │ │
│ │ [🔄 Generate New Affirmation]                     │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4. Calendar Page (12-Week Program View)
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Hero Banner ──────────────────────────────────────┐ │
│ │ 🔥 X3 MOMENTUM                            PRO     │ │
│ │ AI-Powered Resistance Band Tracking               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] [⚙️] │
├─────────────────────────────────────────────────────┤
│ ┌─ Program Overview ─────────────────────────────────┐ │
│ │ 📅 12-Week X3 Transformation Program              │ │
│ │ Progress: Week 6 of 12 (50% Complete) ████████▒▒▒ │ │
│ │ Phase: Intensive Training (Weeks 5-12)            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Foundation Phase (Weeks 1-4) ────────────────────┐ │
│ │ Week 1: [✅P][✅u][✅R][✅P][✅u][✅R][✅R]     │ │
│ │ Week 2: [✅P][✅u][✅R][✅P][✅u][✅R][✅R]     │ │
│ │ Week 3: [✅P][✅u][✅R][✅P][✅u][✅R][✅R]     │ │
│ │ Week 4: [✅P][✅u][✅R][✅P][✅u][✅R][✅R]     │ │
│ │ Legend: P=Push ✅=Complete u=Pull R=Rest          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Intensive Phase (Weeks 5-12) ────────────────────┐ │
│ │ Week 5: [✅P][✅u][✅P][✅u][✅P][✅u][✅R]     │ │
│ │ Week 6: [✅P][✅u][🟠P][⚪u][⚪P][⚪u][⚪R] ← NOW │ │
│ │ Week 7: [⚪P][⚪u][⚪P][⚪u][⚪P][⚪u][⚪R]     │ │
│ │ Week 8: [⚪P][⚪u][⚪P][⚪u][⚪P][⚪u][⚪R]     │ │
│ │ Week 9: [⚪P][⚪u][⚪P][⚪u][⚪P][⚪u][⚪R]     │ │
│ │ Week10: [⚪P][⚪u][⚪P][⚪u][⚪P][⚪u][⚪R]     │ │
│ │ Week11: [⚪P][⚪u][⚪P][⚪u][⚪P][⚪u][⚪R]     │ │
│ │ Week12: [⚪P][⚪u][⚪P][⚪u][⚪P][⚪u][⚪R]     │ │
│ │ Schedule: Push/Pull/Push/Pull/Push/Pull/Rest       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Missed Workout Recovery ──────────────────────────┐ │
│ │ ℹ️ Missed Workout Logic:                          │ │
│ │ If you miss a workout, continue from where you    │ │
│ │ left off (no doubling up). Schedule adjusts       │ │
│ │ automatically to keep you on track.               │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5. Settings Page (Tabbed Interface)
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Hero Banner ──────────────────────────────────────┐ │
│ │ 🔥 X3 MOMENTUM                            PRO     │ │
│ │ AI-Powered Resistance Band Tracking               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] [⚙️] │
├─────────────────────────────────────────────────────┤
│ ┌─ Tab Navigation ──────────────────────────────────┐ │
│ │ [📋 Profile] [🏋️ Exercise] [🎤 Coaching] [💳 Billing] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Profile Tab Content ─────────────────────────────┐ │
│ │ ┌─ Personal Information ───────────────────────────┐ │ │
│ │ │ First Name: [John              ] ✏️          │ │ │
│ │ │ Last Name:  [Smith             ] ✏️          │ │ │
│ │ │ Email:      [john@email.com    ] ✏️          │ │ │
│ │ │ Timezone:   [America/New_York ▼] 🌍          │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                   │ │
│ │ ┌─ X3 Program Settings ────────────────────────────┐ │ │
│ │ │ X3 Start Date: [2024-01-15] 📅               │ │ │
│ │ │ Current Week:  Week 6 (Auto-calculated)       │ │ │
│ │ │ Fitness Level: [Intermediate ▼] 💪           │ │ │
│ │ │ Primary Goal:  [Build muscle and confidence ▼] │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                   │ │
│ │ ┌─ Accessibility Options ──────────────────────────┐ │ │
│ │ │ ☑️ High Contrast Mode                          │ │ │
│ │ │ ☑️ Screen Reader Support                       │ │ │
│ │ │ ☑️ Keyboard Navigation                         │ │ │
│ │ │ Font Size: [Medium ▼] 📖                      │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 6. Rest Day Interface
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Hero Banner ──────────────────────────────────────┐ │
│ │ 🔥 X3 MOMENTUM                            PRO     │ │
│ │ AI-Powered Resistance Band Tracking               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] [⚙️] │
├─────────────────────────────────────────────────────┤
│                                                     │
│      ┌─ Rest Day Card (Centered) ───────────────┐   │
│      │                                          │   │
│      │           🛋️                            │   │
│      │                                          │   │
│      │        Today's Rest Day                  │   │
│      │                                          │   │
│      │   Focus on recovery, hydration,         │   │
│      │        and nutrition                    │   │
│      │                                          │   │
│      │      Week 6 • Day 7                     │   │
│      │                                          │   │
│      │   Recovery Checklist:                   │   │
│      │   💧 Drink 8+ glasses of water          │   │
│      │   🥗 Eat protein-rich meals             │   │
│      │   😴 Get 7-9 hours of sleep             │   │
│      │   🚶 Light walking is beneficial        │   │
│      │   🧘 Practice stress management         │   │
│      │                                          │   │
│      │   Tomorrow: Pull Workout Ready! 💪      │   │
│      │                                          │   │
│      └──────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Navigation Specifications

### Desktop Navigation (Full Text + Icons)
```css
.desktop-nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #E5E5E5;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  color: #666666;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item.active {
  background: #FF6B35;
  color: white;
}

.nav-item:hover {
  background: #F5F5F5;
  color: #FF6B35;
}
```

### Mobile Navigation (Hamburger Menu)
```css
.mobile-nav-trigger {
  display: none;
  padding: 1rem;
  background: none;
  border: none;
  color: #666666;
}

.mobile-nav-menu {
  position: fixed;
  top: 0;
  left: -100%;
  width: 280px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  transition: left 0.3s ease;
  z-index: 1000;
}

.mobile-nav-menu.open {
  left: 0;
}

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .mobile-nav-trigger { display: block; }
}
```

## Component Specifications

### Exercise Card Component
```css
.exercise-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}

.exercise-card.current {
  border-color: #FF6B35;
  box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
}

.exercise-card:hover {
  border-color: #FF6B35;
  box-shadow: 0 4px 16px rgba(255,107,53,0.15);
  transform: translateY(-1px);
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.exercise-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
}

.personal-best-indicator {
  background: linear-gradient(135deg, #FFC107 0%, #FF6B35 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
```

### Bento Stats Grid
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #212121;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}
```

### Full-Width Cadence Button
```css
.cadence-button {
  width: 100%;
  padding: 16px 24px;
  background: #FF6B35;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.cadence-button:hover {
  background: #E55A2B;
  transform: scale(1.02);
}

.cadence-button.active {
  background: #D32F2F;
}

.cadence-timer {
  background: #FFC107;
  color: #212121;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  margin-left: auto;
}
```

## Responsive Breakpoints
- **Mobile**: 320px - 767px (1 column exercise grid, hamburger nav)
- **Tablet**: 768px - 1023px (2 column exercise grid, full nav)  
- **Desktop**: 1024px+ (4 column exercise grid, full nav)

## Accessibility Requirements
- **Color Contrast**: All text meets WCAG AA standards (4.5:1 ratio minimum)
- **Focus States**: Visible 2px fire orange outline on all interactive elements
- **Screen Readers**: Proper ARIA labels, semantic HTML, live regions for updates
- **Keyboard Navigation**: Full app usable via Tab, Enter, Space, Arrow keys
- **High Contrast Mode**: Toggle available with enhanced contrast ratios
- **Touch Targets**: Minimum 44px for all interactive elements

## Animation Guidelines
- **Transitions**: 0.2s ease for most interactions
- **Hover Effects**: Small scale transforms (102%) or color changes
- **Loading States**: Skeleton screens with subtle pulse animation
- **Success Feedback**: Brief scale animation + color change on save
- **Page Transitions**: Subtle fade/slide effects between major sections
- **Rest Timer**: Smooth countdown with visual progress indicator

## Form Patterns
- **Validation**: Real-time for critical fields, on blur for others
- **Error States**: Red border (#D32F2F) + helper text below field
- **Success States**: Green checkmark (#4CAF50) + brief positive feedback
- **Disabled States**: 50% opacity, no interaction
- **Required Fields**: Asterisk (*) in label, clear error messaging
- **Auto-save**: Optimistic updates with rollback on failure

## TTS Integration
- **Exercise Completion**: "{exerciseName} saved and recorded. Catch your breath and get set up for {nextExercise}"
- **Final Exercise**: Varies between "Great job! How are you doing?" and other encouragements
- **Cadence Start**: "Cadence started. 1 second intervals for proper form"
- **Rest Timer**: "Rest period complete. Ready for your next exercise"
- **Personal Bests**: "Outstanding! That's a personal best for {exerciseName}!"

---

*This design specification creates a modern, accessible, and motivational interface that directly addresses the 85% motivation drop-off problem among X3 users through thoughtful UX design and AI-powered coaching integration.*