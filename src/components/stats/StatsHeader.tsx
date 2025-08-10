import React from 'react';

export const StatsHeader: React.FC = () => {
  return (
    <div className="brand-card text-center mb-8">
      <h1 className="text-headline mb-2">
        <span className="brand-fire">Workout</span> <span className="brand-ember">Statistics</span>
      </h1>
      <p className="text-body text-secondary">Track your X3 progress and achievements</p>
    </div>
  );
};