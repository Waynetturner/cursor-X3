# X3 Tracker - Momentum Pro Edition

A comprehensive workout tracking application for the X3 Bar resistance training system, built with Next.js and integrated with Supabase for real-time data management.

## 🏋️‍♂️ About X3 Tracker

X3 Tracker helps users maximize their X3 Bar workouts with intelligent tracking, audio coaching, and progress analytics. The app follows Dr. John Jaquish's X3 Bar methodology with real-time guidance and comprehensive workout logging.

## 🚀 Recent Updates - Component Refactoring (July 2025)

### Major Architecture Improvements
- **✅ ExerciseCard Component**: Extracted 150+ lines of exercise logic into reusable, modular component
- **✅ CadenceButton Component**: Extracted 60+ lines of cadence control into standalone component  
- **✅ Reduced Complexity**: Main page.tsx reduced from 1000+ lines to organized, maintainable structure
- **✅ Zero Regression**: All functionality preserved during refactoring
- **✅ Documentation Consolidation**: Streamlined from 7+ scattered files to 4 comprehensive guides

### Component Architecture
```
src/components/
├── ExerciseCard/          # Modular exercise tracking with band selection, reps, notes
├── CadenceButton/         # Reusable cadence control with audio feedback
├── layout/AppLayout.tsx   # Main navigation and layout structure
├── WorkoutHistory/        # Historical workout data and analytics
├── TTSSettings/           # Text-to-speech configuration
├── RestTimer/             # 90-second rest period management
└── AICoaching/            # AI-powered form guidance
```

## ✨ Key Features

### Workout Tracking
- **Exercise Logging**: Track full reps, partial reps, and band selection
- **Audio Cadence**: 2-second metronome for proper lifting tempo
- **Rest Timer**: Automated 90-second rest periods between exercises
- **Workout History**: Complete exercise history with progress analytics

### AI & Audio Integration
- **Text-to-Speech**: Premium TTS coaching with OpenAI.fm integration
- **AI Form Coaching**: Real-time exercise guidance and tips
- **Voice Selection**: Multiple voice options for personalized experience
- **Audio Cues**: Automated workout phase announcements

### User Experience
- **Test Mode**: Purple banner development mode for testing
- **Real-time Updates**: Live data synchronization with Supabase
- **Responsive Design**: Mobile-optimized for gym use
- **Accessibility**: Screen reader support and keyboard navigation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.4, React 19, TypeScript
- **Styling**: Tailwind CSS 4.1.11
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Audio**: Web Speech API, OpenAI.fm TTS
- **Animation**: Framer Motion
- **UI Components**: Radix UI, Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd x3-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main workout interface
│   ├── dashboard/         # User dashboard and analytics  
│   ├── calendar/          # Workout scheduling
│   ├── goals/             # Goal setting and tracking
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ExerciseCard/      # 🆕 Modular exercise tracking
│   ├── CadenceButton/     # 🆕 Audio cadence control
│   ├── layout/            # Navigation and layout
│   ├── WorkoutHistory/    # Historical data display
│   └── [other components]
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
└── contexts/              # React context providers
```

## 🧪 Testing

Use the included testing checklist:
```bash
# See TESTING_CHECKLIST.md for comprehensive testing guide
```

### Quick Verification
1. Start development server: `npm run dev`
2. Test ExerciseCard: Band selection, rep inputs, save functionality  
3. Test CadenceButton: Start/stop cadence with audio feedback
4. Verify TTS integration for premium users
5. Check workout history and data persistence

## 📚 Documentation

- **TTS_COMPLETE.md** - Complete TTS & Audio Implementation Guide
- **PROJECT_SPECS.md** - Comprehensive Project Specifications
- **FEATURES.md** - Complete Features & Backend Integration
- **TESTING_CHECKLIST.md** - Systematic Testing Guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Links

- [X3 Bar Official Site](https://x3bar.com)
- [Dr. John Jaquish](https://jaquishbiomedical.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Latest Update**: Component refactoring completed July 2025 - significantly improved maintainability and modularity while preserving all functionality.
