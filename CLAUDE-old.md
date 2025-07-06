# X3 Tracker - Claude Development Guide

## Project Overview

X3 Tracker is a Next.js 15 application for tracking X3 resistance band workouts. It's designed to help users follow the X3 training system developed by Dr. John Jaquish, featuring workouts with variable resistance bands.

### Key Features
- **Workout Tracking**: Daily workout logging with exercise tracking
- **X3 Program Logic**: Automated workout scheduling based on the X3 program structure
- **Supabase Integration**: Backend database for user data and workout history
- **Accessibility**: Built with screen reader support and keyboard navigation
- **Audio Cadence**: Metronome functionality for workout timing
- **Google OAuth**: User authentication via Google

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React version with concurrent features
- **TypeScript**: Type safety throughout the application
- **Tailwind CSS v4**: Utility-first CSS framework
- **Framer Motion**: Animation library for smooth transitions
- **Lucide React**: Icon library for UI components

### Backend & Database
- **Supabase**: PostgreSQL database with real-time capabilities
- **Supabase Auth**: Authentication with OAuth providers
- **Row Level Security (RLS)**: Database-level security policies

### Development Tools
- **ESLint**: Code linting with Next.js configuration
- **PostCSS**: CSS processing for Tailwind
- **Turbopack**: Fast bundler for development (Next.js 15 feature)

## Architecture

### Project Structure
```
/src
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main workout interface
│   ├── dashboard/         # Dashboard page
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client & X3 logic
│   └── accessibility.ts   # Accessibility utilities
```

### Key Components

#### Main Workout Interface (`/src/app/page.tsx`)
- Primary workout tracking interface
- Handles exercise data entry and saving
- Integrates with Supabase for data persistence
- Includes audio cadence/metronome functionality
- Responsive design with mobile-first approach

#### X3 Program Logic (`/src/lib/supabase.ts`)
- Contains X3 exercise definitions and scheduling
- Calculates daily workouts based on program structure
- Week 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest
- Week 5+: Push/Pull/Push/Pull/Push/Pull/Rest

#### Accessibility (`/src/lib/accessibility.ts`)
- Screen reader announcements
- Focus management utilities
- Keyboard navigation support

## Database Schema

### Tables
- `profiles`: User profile information including X3 start date
- `workout_exercises`: Individual exercise records with reps, bands, notes
- `workouts`: Workout session records (legacy, may be deprecated)

### Key Fields
- `user_id`: References auth.users
- `workout_local_date_time`: Timestamp in user's local timezone
- `workout_type`: 'Push', 'Pull', or 'Rest'
- `week_number`: Current week in the X3 program
- `exercise_name`: Name of the exercise
- `band_color`: Resistance band color (White, Light Gray, Dark Gray, Black)
- `full_reps`: Number of full-range repetitions
- `partial_reps`: Number of partial-range repetitions
- `notes`: User notes about the exercise

## Development Patterns

### State Management
- Uses React hooks for local state management
- No external state management library
- Supabase handles server state synchronization

### Data Flow
1. User authentication via Supabase Auth
2. Fetch user profile and calculate today's workout
3. Load previous workout data for exercise defaults
4. Save new workout data with upsert operations

### Error Handling
- Comprehensive console logging for debugging
- User-friendly error messages
- Graceful fallbacks for missing data

### Accessibility Best Practices
- Proper ARIA labels and roles
- Screen reader announcements for state changes
- Keyboard navigation support
- Focus management

## Configuration

### Environment Variables
- Supabase credentials are handled by `@supabase/auth-helpers-nextjs`
- No explicit environment variables in codebase (uses Supabase defaults)

### Build Configuration
- **Next.js Config**: Minimal configuration in `next.config.ts`
- **TypeScript**: Strict mode enabled with path aliases (`@/*` -> `./src/*`)
- **Tailwind**: v4 configuration with PostCSS plugin
- **ESLint**: Next.js core web vitals and TypeScript rules

## Key Features & Functionality

### X3 Program Structure
- **Exercises**: 
  - Push: Chest Press, Tricep Press, Overhead Press, Front Squat
  - Pull: Deadlift, Bent Row, Bicep Curl, Calf Raise
- **Band Colors**: White (lightest) → Light Gray → Dark Gray → Black (heaviest)
- **Workout Schedule**: Automated based on start date and current week

### Audio Cadence
- Browser-based audio synthesis
- 1-second interval metronome
- Helps maintain proper exercise timing
- Accessible controls with screen reader support

### Data Persistence
- Real-time saving of exercise data
- Historical workout tracking
- Previous workout data loaded as defaults

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow Next.js App Router patterns
- Maintain accessibility standards
- Use Tailwind classes for styling
- Implement proper error handling and logging

### Performance
- Leverage Next.js 15 features (Turbopack in dev)
- Use React 19 concurrent features where appropriate
- Minimize bundle size with selective imports

### Testing
- No testing framework currently configured
- Manual testing for accessibility features
- Database connection testing built into the application

## Deployment

### Development
```bash
npm run dev --turbopack  # Uses Turbopack for faster development
```

### Production
```bash
npm run build
npm start
```

### Database Migrations
- Supabase migrations located in `/cursor/x3-momentum-main/supabase/migrations/`
- Manual SQL migrations for schema changes

## Important Notes

### Dual Structure
The project contains both:
1. Current Next.js implementation in `/src/`
2. Legacy/reference implementation in `/cursor/x3-momentum-main/`

The dashboard page (`/src/app/dashboard/page.tsx`) currently imports from the legacy structure, indicating a migration in progress.

### Authentication Flow
- Google OAuth integration
- Automatic profile creation on first login
- Start date defaults to registration date

### Accessibility Priority
This application prioritizes accessibility with:
- Screen reader support throughout
- Keyboard navigation
- High contrast mode considerations
- Audio feedback for workout timing

### Mobile-First Design
- Responsive layout with mobile considerations
- Touch-friendly interface elements
- Adaptive navigation (sidebar on desktop, top bar on mobile)

## Future Considerations

### Potential Improvements
- Add testing framework (Jest, React Testing Library)
- Implement proper error boundaries
- Add offline capabilities
- Enhanced analytics and progress tracking
- Integration with fitness wearables

### Technical Debt
- Resolve dual project structure
- Consolidate database table usage (workout_exercises vs workouts)
- Implement proper TypeScript throughout legacy code
- Add comprehensive error handling

---

*This document serves as a comprehensive guide for Claude instances working on the X3 Tracker project. It covers the essential architecture, patterns, and development practices needed to effectively contribute to the codebase.*