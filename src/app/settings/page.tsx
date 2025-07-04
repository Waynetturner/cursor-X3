'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const userTier = 2; // 1 = Foundation, 2 = Momentum, 3 = Mastery (replace with real user tier logic)

const tabs = [
  { label: "Profile", value: "profile" },
  { label: "Preferences", value: "preferences" },
  ...(userTier > 1 ? [{ label: "Advanced", value: "advanced" }] : []),
];

export default function Settings() {
  const [highContrast, setHighContrast] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(tabs[0].value);

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
          <div className="flex border-b border-[#FF6B35] mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-200 ${
                  activeTab === tab.value
                    ? "border-b-4 border-[#FF6B35] text-[#FF6B35]"
                    : "text-gray-500 hover:text-[#FF6B35]"
                }`}
                onClick={() => setActiveTab(tab.value)}
                aria-selected={activeTab === tab.value}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[200px]">
            {activeTab === "profile" && (
              <div>{/* Profile form goes here */}Profile settings coming soon.</div>
            )}
            {activeTab === "preferences" && (
              <div>{/* Preferences form goes here */}Preferences coming soon.</div>
            )}
            {activeTab === "advanced" && userTier > 1 && (
              <div>{/* Advanced settings go here */}Advanced features for Momentum/Mastery users.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 