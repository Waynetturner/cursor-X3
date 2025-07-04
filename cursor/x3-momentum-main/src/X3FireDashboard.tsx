"use client" 
import React, { useState } from 'react';
import { Play, Pause, Save, Settings, BarChart3, Calendar, Flame, Target, Trophy, TrendingUp, Info } from 'lucide-react';

const X3FireDashboard = () => {
  const [cadenceActive, setCadenceActive] = useState(false);
  const [exercises, setExercises] = useState([
    { 
      name: "Deadlift", 
      band: "Dark Gray", 
      fullReps: 26, 
      partialReps: 0, 
      notes: "", 
      saved: true,
      lastWorkout: "28+0 reps with Dark Gray band"
    },
    { 
      name: "Bent Row", 
      band: "White", 
      fullReps: 27, 
      partialReps: 3, 
      notes: "", 
      saved: true,
      lastWorkout: "25+4 reps with White band"
    },
    { 
      name: "Bicep Curl", 
      band: "White", 
      fullReps: 29, 
      partialReps: 3, 
      notes: "", 
      saved: true,
      lastWorkout: "26+2 reps with White band"
    },
    { 
      name: "Calf Raise", 
      band: "Light Gray", 
      fullReps: 20, 
      partialReps: 0, 
      notes: "", 
      saved: false,
      lastWorkout: "19+0 reps with Light Gray band"
    }
  ]);

  const bandColors = ["White", "Light Gray", "Dark Gray", "Black"];
  
  const updateExercise = (index, field, value) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value, saved: false } : ex
    ));
  };

  const saveExercise = (index) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, saved: true } : ex
    ));
  };

  const toggleCadence = () => {
    setCadenceActive(!cadenceActive);
  };

  // Find the next exercise to do (first unsaved, or first)
  const nextIdx = exercises.findIndex(ex => !ex.saved) !== -1
    ? exercises.findIndex(ex => !ex.saved)
    : 0;

  // Cadence Button Component
  const CadenceButton = (
    <button 
      onClick={toggleCadence}
      className={`w-full px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2
        ${cadenceActive 
          ? 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white' 
          : 'bg-gradient-to-r from-[#FF6B35] to-[#D32F2F] hover:from-[#FF8A50] hover:to-[#B71C1C] text-white transform hover:scale-105'}
      `}
      aria-pressed={cadenceActive}
      aria-label={cadenceActive ? 'Stop Cadence' : 'Start Cadence'}
    >
      {cadenceActive ? <Pause size={20} /> : <Play size={20} />}
      <span>{cadenceActive ? 'Stop Cadence' : 'Start Cadence (1s)'}</span>
    </button>
  );

  // Exercise Card Component
  const ExerciseCard = (exercise, index) => (
    <div key={exercise.name} className="bg-[#303030] rounded-2xl p-6 shadow-md border border-[#212121] hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">{exercise.name}</h3>
        <button className="w-8 h-8 bg-[#212121] rounded-lg flex items-center justify-center hover:bg-[#FF6B35] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" aria-label="Exercise Info">
          <Info size={16} className="text-[#FFC107]" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#FFC107] mb-2">Band Color</label>
          <select
            value={exercise.band}
            onChange={(e) => updateExercise(index, 'band', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#212121] border border-[#FF6B35] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors"
          >
            {bandColors.map(color => (
              <option key={color} value={color}>{color} Band</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#FFC107] mb-2">Full Reps</label>
            <input
              type="number"
              value={exercise.fullReps}
              onChange={(e) => updateExercise(index, 'fullReps', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-[#212121] border border-[#FF6B35] text-center font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#FFC107] mb-2">Partial Reps</label>
            <input
              type="number"
              value={exercise.partialReps}
              onChange={(e) => updateExercise(index, 'partialReps', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-[#212121] border border-[#FF6B35] text-center font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#FFC107] mb-2">Notes</label>
          <textarea
            value={exercise.notes}
            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
            placeholder="Add notes about form, difficulty, etc."
            className="w-full px-4 py-3 rounded-xl bg-[#212121] border border-[#FF6B35] text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors"
            rows={3}
          />
        </div>
        <div className="pt-2 border-t border-[#212121]">
          <p className="text-sm text-[#FFC107] mb-3">Last time (6/30/2025):</p>
          <p className="text-sm font-medium text-white">{exercise.lastWorkout}</p>
        </div>
        <button
          onClick={() => saveExercise(index)}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2
            ${exercise.saved
              ? 'bg-[#212121] text-[#FF6B35] border-2 border-[#FF6B35] hover:bg-[#303030]'
              : 'bg-gradient-to-r from-[#FF6B35] to-[#D32F2F] hover:from-[#FF8A50] hover:to-[#B71C1C] text-white shadow-lg transform hover:scale-105'}
          `}
          aria-pressed={exercise.saved}
        >
          <Save className="inline mr-2" size={16} />
          {exercise.saved ? 'Saved!' : 'Save Exercise'}
        </button>
      </div>
    </div>
  );

  // Stats Card Component
  const StatsCard = ({ icon, value, label, sublabel, gradient }) => (
    <div className={`rounded-2xl p-6 shadow-md border border-[#212121] hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-[#303030] text-white`}>
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>{icon}</div>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <div className="mt-4">
        <p className="text-[#FFC107] font-medium">{label}</p>
        <p className="text-sm text-gray-300">{sublabel}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212121] via-[#FF6B35] to-[#D32F2F]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-20 bg-gradient-to-b from-[#FF6B35] to-[#D32F2F] flex flex-col items-center py-6 shadow-lg">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-8 backdrop-blur-sm">
            <Flame className="text-white" size={24} />
          </div>
          <nav className="flex flex-col space-y-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-opacity-40 transition-all duration-200">
              <BarChart3 size={20} />
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-opacity-30 transition-all duration-200">
              <Calendar size={20} />
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-opacity-30 transition-all duration-200">
              <Target size={20} />
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-opacity-30 transition-all duration-200">
              <Settings size={20} />
            </div>
          </nav>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-[#212121] shadow-sm border-b border-[#303030] px-4 md:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Today's Pull Workout</h1>
                <p className="text-[#FFC107] mt-1">Week 6 • "Train to failure, not to a number"</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-[#FFC107] hover:text-white transition-colors" aria-label="Info">
                  <Info size={20} />
                </button>
                <button className="text-[#FFC107] hover:text-white transition-colors">Sign Out</button>
                <button className="text-[#FFC107] hover:text-white transition-colors" aria-label="Settings">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatsCard icon={<Flame className="text-white" size={20} />} value="7" label="Fire Streak" sublabel="days in a row" gradient="bg-gradient-to-br from-[#FF6B35] to-[#D32F2F]" />
              <StatsCard icon={<BarChart3 className="text-white" size={20} />} value="65%" label="Week Progress" sublabel="4 of 6 workouts" gradient="bg-gradient-to-br from-[#FFC107] to-[#FF6B35]" />
              <StatsCard icon={<Trophy className="text-white" size={20} />} value="23" label="Total Workouts" sublabel="since starting" gradient="bg-gradient-to-br from-[#FF6B35] to-[#D32F2F]" />
              <StatsCard icon={<TrendingUp className="text-white" size={20} />} value="+12%" label="Strength Gain" sublabel="this month" gradient="bg-gradient-to-br from-[#D32F2F] to-[#FF6B35]" />
            </div>
            {/* Desktop: Cadence button in its own card */}
            <div className="hidden md:block mb-8">
              <div className="bg-[#303030] rounded-2xl p-6 shadow-md border border-[#212121] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Workout Cadence</h3>
                  <p className="text-gray-300">Audio metronome to help maintain proper exercise timing</p>
                </div>
                <div className="w-64">{CadenceButton}</div>
              </div>
            </div>
            {/* Mobile: Cadence button above next exercise */}
            <div className="block md:hidden mb-4">
              <div className="mb-4">
                <div className="bg-[#303030] rounded-2xl p-6 shadow-md border border-[#212121] flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Workout Cadence</h3>
                  <p className="text-gray-300 mb-4 text-center">Audio metronome to help maintain proper exercise timing</p>
                  <div className="w-full">{CadenceButton}</div>
                </div>
              </div>
              {/* Next exercise card */}
              {ExerciseCard(exercises[nextIdx], nextIdx)}
            </div>
            {/* Exercise Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {exercises.map((exercise, index) => (
                // On mobile, skip the next exercise card (already rendered above)
                <React.Fragment key={exercise.name}>
                  {(index !== nextIdx || window.innerWidth >= 768) && ExerciseCard(exercise, index)}
                </React.Fragment>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default X3FireDashboard; 