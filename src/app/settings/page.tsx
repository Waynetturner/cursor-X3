'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const [highContrast, setHighContrast] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const highContrastPreference = localStorage.getItem('highContrast') === 'true';
    setHighContrast(highContrastPreference);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
  };

  return (
    <div className={highContrast ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-gradient-to-br from-green-800 to-teal-900'}>
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center mb-8">
          <button onClick={() => router.back()} className="mr-4 p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Back to dashboard">
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </header>
        <main>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Accessibility</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleHighContrast}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
              >
                {highContrast ? '🌞 Normal Contrast' : '🌗 High Contrast'}
              </button>
              <span className="text-sm opacity-80">For users with low vision or those who prefer extra visual clarity.</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
} 