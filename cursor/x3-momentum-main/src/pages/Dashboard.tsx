import React, { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/components/SubscriptionProvider';
import { Button } from '@/components/ui/button';
import { LogOut, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkoutSection } from '@/components/WorkoutSection';
import { AdminButton } from '@/components/AdminButton';
import { UserSettings } from '@/components/UserSettings';
import { CoachSection } from '@/components/CoachSection';
import { DashboardStats } from '@/components/DashboardStats';
import { WorkoutHistory } from '@/components/WorkoutHistory';
import { RouteTestComponent } from '@/components/RouteTestComponent';
import { useWorkoutManagement } from '@/hooks/useWorkoutManagement';

const Dashboard = () => {
  console.log('=== DASHBOARD COMPONENT ===');
  console.log('Dashboard component is rendering');
  console.log('=== END DASHBOARD COMPONENT ===');
  
  const { user, signOut } = useAuth();
  const { subscribed, subscriptionTier, subscriptionEnd, isLoading: subscriptionLoading } = useSubscription();
  const { workoutCompleted, handleExerciseSaved } = useWorkoutManagement(user?.id);
  
  // State to trigger WorkoutHistory refresh
  const [workoutHistoryRefreshTrigger, setWorkoutHistoryRefreshTrigger] = useState(0);

  const handleSignOut = async () => {
    console.log('Dashboard: Signing out user');
    await signOut();
  };

  const handleWorkoutUpdated = useCallback(() => {
    console.log('Dashboard: Workout updated, refreshing workout history');
    handleExerciseSaved();
    
    // Trigger WorkoutHistory refresh by incrementing the trigger
    setWorkoutHistoryRefreshTrigger(prev => prev + 1);
  }, [handleExerciseSaved]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Route Test Component - temporary for debugging */}
      <RouteTestComponent />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🏋️‍♂️ PapaFit X3 Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <AdminButton />
              <UserSettings />
              <Link to="/pricing">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Pricing
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <DashboardStats />
        
        {/* Main Content - Single Column Layout */}
        <div className="space-y-8 mt-8">
          
          {/* Workout Section */}
          <WorkoutSection onWorkoutUpdated={handleWorkoutUpdated} />
          
          {/* Coach Section - Now below the workout */}
          <CoachSection 
            workoutCompleted={workoutCompleted}
            onWorkoutFinished={handleWorkoutUpdated}
          />
          
          {/* Workout History - with refresh trigger */}
          <WorkoutHistory refreshTrigger={workoutHistoryRefreshTrigger} />
          
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
