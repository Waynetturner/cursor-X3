# Changelog

All notable changes to the X3 Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Stripe integration for real subscription billing
- Data export functionality (CSV format)
- Voice input for coaching interactions
- Enhanced AI coaching with conversation memory
- Mobile app development (React Native)

---

## [2.1.1] - 2025-08-11

### 🐛 Critical Bug Fix - Calendar Timezone Synchronization

#### Calendar Timezone Issue Resolution
- **Fixed Critical Calendar Bug** - Resolved timezone synchronization issue causing calendar to display workout sequence one day ahead
- **Root Cause Identified** - All date calculations used UTC time instead of user's local timezone, causing calendar to show 8/11 when user was in 8/10 timezone
- **Existing Infrastructure Utilized** - Leveraged existing `profiles.timezone` and `workout_local_date_time` columns that were previously unused in calendar calculations

#### Technical Improvements
- **getUserToday() Pattern** - Established timezone-aware helper function for all future date calculations
- **Dynamic Calendar Calculations** - Removed dependency on pre-filled database entries, calendar now calculates workouts dynamically
- **Multi-User Timezone Support** - Each user's timezone handled individually from their profile settings
- **Developer Guidelines** - Documented timezone-aware development patterns for future sessions

#### Files Modified (18 total)
- `src/lib/daily-workout-log.ts` - Major timezone fixes and getUserToday() helper function
- `src/app/calendar/page.tsx` - Updated to use timezone-aware calculations  
- `src/lib/user-stats.ts` - Updated to use new daily log functions
- `src/lib/services/workout-service.ts` - Fixed TypeScript validation issues
- 14+ additional files with timezone pattern updates

#### User Impact
- **Calendar Accuracy** - Calendar now displays correct workout sequence in user's local timezone
- **Dashboard Sync** - Dashboard status correctly synchronized with calendar display  
- **Future Reliability** - Established patterns prevent similar timezone issues in future development

---

## [2.1.0] - 2025-01-19

### 🚀 Documentation Consolidation & Production Readiness

#### Major Documentation Overhaul
- **Documentation Consolidation** - Reduced from 24+ fragmented files to 5 comprehensive guides
  - `CURRENT_STATE.md` - Complete application overview and architecture
  - `DEVELOPER_GUIDE.md` - Development setup, workflow, and best practices  
  - `API_DOCUMENTATION.md` - Technical API reference with hooks and functions
  - `FEATURE_DOCUMENTATION.md` - Complete user-facing feature documentation
  - `CHANGELOG.md` - Updated version history and current state
- **Archive Management** - Historical documents moved to `docs/archive/` with proper indexing
- **Content Migration** - Relevant content extracted from old docs and integrated into new structure
- **Cross-References** - Comprehensive linking between related documentation sections

#### Component Refactoring (Completed)
- **ExerciseCard Component** - Extracted 150+ lines of exercise logic into reusable, modular component
  - Band selection dropdown functionality
  - Rep input handling (full reps, partial reps)
  - Exercise notes field with character limits
  - Save/retry functionality with comprehensive loading states
  - Exercise info links to Jaquish Biomedical resources
- **CadenceButton Component** - Extracted 60+ lines of cadence control into standalone component
  - Start/stop cadence toggle functionality
  - 2-second metronome audio feedback with accessibility support
  - Visual state indicators (Active/Inactive)
  - Screen reader announcements for state changes
- **Code Organization** - Clear separation of concerns between components
- **Zero Functionality Regression** - All existing features preserved during refactoring

#### Production Readiness Achievements
- **Zero Console Errors** - Complete elimination of runtime errors in development and production
- **SSR Compatibility** - All localStorage operations properly guarded for server-side rendering
- **Error Handling** - Comprehensive error boundaries and user feedback systems
- **Loading States** - Professional loading indicators for all async operations
- **Type Safety** - Enhanced TypeScript interfaces throughout the application

#### AI Coaching System (Complete)
- **Multi-Tier Coaching** - Differentiated coaching based on subscription tier
  - Static coaching (Momentum tier) with 84+ pre-written motivational phrases
  - Dynamic AI coaching (Mastery tier) with OpenAI GPT-4 integration
  - N8N workflow integration for advanced AI processing
- **Chat Interface** - Professional floating chat component with message history
- **Voice Integration** - Automatic TTS for coaching responses with manual replay
- **Context Awareness** - Real-time workout data shared with AI for personalized advice
- **Fallback System** - Graceful degradation when AI services unavailable

#### Enhanced TTS System
- **OpenAI.fm Integration** - Premium TTS with enhanced voice quality and dynamic instructions
- **Fallback Hierarchy** - OpenAI.fm → Web Speech → Browser → Test Mode
- **Context-Aware Audio** - Voice instructions adapt to workout situation
  - Energetic for exercises, calm for rest periods
  - Professional tone for coaching, motivational for achievements
- **Voice Options** - 5 neural voices including premium 'Ash' voice
- **Loading Indicators** - Real-time source indicators (🤖 🔊 📱 🧪)

### Changed
- **Main page.tsx** - Reduced from 1000+ lines to organized, maintainable structure
- **Component Architecture** - Improved modularity and reusability across the application
- **Documentation Structure** - Consolidated from scattered files to comprehensive guides
- **Error Handling** - Enhanced user experience with retry mechanisms and clear error messages
- **Build Performance** - Improved compilation times with modular architecture

### Fixed
- **SSR localStorage Errors** - Proper client-side guards for all localStorage operations
- **React Import Positioning** - Corrected import ordering in TypeScript files
- **useEffect Infinite Loops** - Fixed dependency arrays in rest timer and other components
- **Web Speech API Race Conditions** - Added proper event listeners for voice loading
- **Memory Leaks** - Proper cleanup in test mode service and component unmounting
- **TTS Loading States** - Comprehensive loading indicators and error feedback
- **Component State Isolation** - Improved state management between exercise cards

### Added
- **Test Mode System** - SSR-safe mock data system for development and testing
- **Timezone Handling** - Central timezone management (America/Chicago) for consistent data
- **Enhanced Analytics** - Comprehensive progress tracking with streak calculations
- **Subscription Gating** - Proper feature access control across all tiers
- **Advanced Settings** - Developer tools and connection testing interfaces
- **Accessibility Features** - Screen reader support and keyboard navigation
- **Mobile Optimization** - Responsive design across all device sizes

### Infrastructure
- **Dependency Updates** - All packages updated to latest stable versions
- **Build Optimization** - Tree shaking and code splitting for optimal performance
- **Hot Reload** - Faster development experience with component isolation
- **Database Schema** - Enhanced with TTS settings and coaching request tracking
- **Edge Functions** - Deployed and configured for TTS and AI coaching

### Development Experience
- **Component Isolation** - Changes to one component don't affect others
- **Debug Logging** - Enhanced console output with categorized messages
- **Testing Framework** - Comprehensive manual testing checklist
- **Code Standards** - Established TypeScript and React best practices
- **Documentation Quality** - Professional-grade documentation for all aspects

---

## [2.0.0] - 2025-01-01

### Added
- **Initial X3 Tracker Application** - Complete fitness tracking system for X3 resistance bands
- **Supabase Integration** - Backend authentication, database, and real-time subscriptions
- **Exercise Tracking** - 4-card layout with band selection and rep counting
- **Workout History** - Complete exercise logging with progression analysis
- **Progress Analytics** - Statistics dashboard with streak tracking and achievements
- **12-Week Program** - Complete X3 program calendar with phase tracking
- **Subscription Tiers** - Foundation, Momentum, and Mastery tier system
- **User Authentication** - Email/password and Google OAuth integration
- **Mobile-Responsive Design** - Optimized for mobile-first usage

### Technical Stack
- **Next.js 15.3.4** with React 19.0.0 and TypeScript
- **Tailwind CSS 4.1.11** for styling with custom fire theme
- **Supabase** for backend services and PostgreSQL database
- **Framer Motion** for animations and transitions
- **Radix UI** for accessible component primitives
- **Row Level Security (RLS)** for data protection

### Features
- **Exercise Cards** - Interactive workout tracking interface
- **Band Progression** - Intelligent band selection based on performance history
- **Program Calendar** - 12-week X3 schedule with Push/Pull/Rest patterns
- **User Profiles** - X3 start date and fitness level tracking
- **Progress Metrics** - Comprehensive workout statistics and achievements

---

## Version History Summary

- **v2.1.0** - Documentation Consolidation, Component Refactoring, AI Coaching, Production Readiness
- **v2.0.0** - Initial X3 Tracker Release with Core Features

---

## Development Guidelines

### Semantic Versioning
- **Major (x.0.0)** - Breaking changes, major feature additions
- **Minor (0.x.0)** - New features, component refactoring, significant improvements
- **Patch (0.0.x)** - Bug fixes, documentation updates, minor improvements

### Changelog Format
- **Added** - New features and capabilities
- **Changed** - Changes in existing functionality
- **Fixed** - Bug fixes and error corrections
- **Removed** - Features or files removed
- **Security** - Security vulnerability fixes
- **Infrastructure** - Development, build, and deployment improvements

### Documentation Standards
- All major changes documented with context and impact
- Technical details provided for developer reference
- User-facing changes explained for stakeholders
- Breaking changes clearly marked with migration guidance
