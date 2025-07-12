# X3 Momentum Pro - Claude Development Guide

## Project Overview

X3 Momentum Pro is an AI-powered resistance band workout tracker specifically designed for X3 Bar users. Based on comprehensive market research, we've identified that **85% of X3 users experience motivation drop-off**, making this the critical problem to solve. The app addresses this through intelligent coaching, structured tracking, and X3-specific optimization.

### Core Problem Statement
- **85% motivation drop-off rate** among X3 users (validated by market research)
- Mental toughness demands of "train to failure" protocol create workout avoidance
- Progression frustration due to large band jumps (40+ reps to advance)
- Lack of systematic tracking leads to decreased motivation over time

### Target Market (Premium Segment)
- **Struggling Users** (35% of market, 95% conversion probability): Currently inconsistent, need motivation systems
- **New X3 Users** (25% of market, 65% conversion probability): Prevention-focused habit formation
- **Consistent Users** (30% of market, 80% conversion probability): Seeking optimization and advanced features
- Users have already invested $500+ in X3 equipment (premium market with spending capacity)

## Technology Stack (2025 Modern Approach)

### Frontend Architecture
- **React 18** with Next.js 15 (App Router)
- **TypeScript** for type safety throughout
- **Tailwind CSS v4** with fire theme design system
- **Zustand** for client state management
- **React Query** for server state synchronization
- **Framer Motion** for smooth animations

### Backend & Services
- **Supabase**: PostgreSQL with real-time subscriptions, RLS security
- **Stripe**: Subscription management with webhook integration
- **OpenAI/Claude APIs**: AI coaching features (tier-dependent)
- **Resend**: Email notifications and reminders

### Design System (Fire Theme - Solid Colors Only)
- **Fire Orange**: #FF6B35 (Primary CTAs, progress indicators)
- **Ember Red**: #D32F2F (Urgent actions, intensity indicators)
- **Golden Flame**: #FFC107 (Achievements, success states)
- **Pure White**: #FFFFFF (Content backgrounds - NO transparency)
- **Charcoal**: #212121 (Primary text, dark backgrounds)

## Revenue Model (Validated by Market Research)

### Foundation Tier ($5/month, $50/year)
- Basic workout tracking and saving
- Shows last settings from previous workout
- Simple workout history (last 2 workouts only)
- Basic cadence button functionality
- Manual progression tracking
- Target: 70% of users seeking simple solutions

### Momentum Tier ($15/month, $150/year) - **Static Intelligence Coach**
- All Foundation features
- **Pre-programmed coaching system** with intelligent progress monitoring
- 90-second rest timers with scripted TTS feedback
- Plateau detection with pre-written recommendations
- Progress celebration with static motivational messages
- Extended history and analytics
- Streak tracking and milestone recognition
- Goal setting with pre-generated affirmations
- **Intelligence**: System monitors progress patterns and delivers appropriate pre-written responses
- **TTS Examples**: "Great job! You hit 32 reps - keep building that strength!"
- Target: 35% of struggling users (90% willingness to pay)

### Mastery Tier ($25/month, $250/year) - **Dynamic AI Coach**
- All Momentum features
- **Live AI coaching** with OpenAI/Claude API integration
- Real-time analysis of user workout feedback and performance
- Personalized responses to user's specific comments about energy, form, challenges
- Adaptive program modifications based on individual progress patterns
- Dynamic goal adjustments and personalized affirmations
- Advanced form correction suggestions via AI analysis
- Community features and leaderboards
- **Intelligence**: True AI that reads user input and generates contextual, personalized responses
- **AI Examples**: User says "felt weak today" → AI responds "I understand those days. Your consistency matters more than peak performance. Consider lighter bands today and focus on perfect form."
- Target: 30% of consistent users willing to pay premium

## Tier Feature Comparison

| Feature | Foundation ($5) | Momentum ($15) | Mastery ($25) |
|---------|----------------|----------------|---------------|
| **Workout Tracking** | ✅ Basic | ✅ Enhanced | ✅ Advanced |
| **Progress Analytics** | ❌ | ✅ Pre-built charts | ✅ AI-analyzed insights |
| **TTS Feedback** | ❌ | ✅ Scripted messages | ✅ AI-generated speech |
| **Rest Timers** | ❌ | ✅ 90-second automated | ✅ Adaptive timing |
| **Coaching Type** | ❌ None | 🤖 **Static Intelligence** | 🧠 **Dynamic AI** |
| **Response Method** | ❌ | 📝 Pre-written message bank | 💬 Real-time AI generation |
| **User Input Analysis** | ❌ | ✅ Pattern recognition | ✅ Natural language processing |
| **Personalization** | ❌ | ✅ Rule-based triggers | ✅ Contextual understanding |
| **API Costs** | $0 | $0 (no AI APIs) | $$ (OpenAI/Claude) |

### Key Technical Distinction