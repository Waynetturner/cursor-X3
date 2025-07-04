'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const userTier = 2; // 1 = Foundation, 2 = Momentum, 3 = Mastery (replace with real user tier logic)

const tabs = [
  { label: "Profile", value: "profile" },
  { label: "Preferences", value: "preferences" },
  { label: "Measurements", value: "measurements" },
  ...(userTier > 1 ? [{ label: "Advanced", value: "advanced" }] : []),
];

export default function Settings() {
  const [highContrast, setHighContrast] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const [user, setUser] = useState<any>(null);
  
  // Measurement preferences
  const [measurementTrackingEnabled, setMeasurementTrackingEnabled] = useState(false);
  const [unitSystem, setUnitSystem] = useState('imperial'); // 'imperial' or 'metric'
  const [enabledMeasurements, setEnabledMeasurements] = useState({
    weight: false,
    bodyFat: false,
    chest: false,
    waist: false,
    arms: false
  });

  useEffect(() => {
    const highContrastPreference = localStorage.getItem('highContrast') === 'true';
    setHighContrast(highContrastPreference);
    
    // Load user and measurement preferences
    const loadUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Load measurement preferences from localStorage
        const measurementEnabled = localStorage.getItem('measurementTrackingEnabled') === 'true';
        const units = localStorage.getItem('unitSystem') || 'imperial';
        const enabled = JSON.parse(localStorage.getItem('enabledMeasurements') || '{"weight":false,"bodyFat":false,"chest":false,"waist":false,"arms":false}');
        
        setMeasurementTrackingEnabled(measurementEnabled);
        setUnitSystem(units);
        setEnabledMeasurements(enabled);
      }
    };
    
    loadUserData();
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
  };

  const saveMeasurementPreferences = () => {
    localStorage.setItem('measurementTrackingEnabled', measurementTrackingEnabled.toString());
    localStorage.setItem('unitSystem', unitSystem);
    localStorage.setItem('enabledMeasurements', JSON.stringify(enabledMeasurements));
  };

  const toggleMeasurementTracking = () => {
    const newValue = !measurementTrackingEnabled;
    setMeasurementTrackingEnabled(newValue);
    if (!newValue) {
      // If disabling, reset all measurements to false
      setEnabledMeasurements({
        weight: false,
        bodyFat: false,
        chest: false,
        waist: false,
        arms: false
      });
    }
  };

  const toggleMeasurement = (measurement: keyof typeof enabledMeasurements) => {
    setEnabledMeasurements(prev => ({
      ...prev,
      [measurement]: !prev[measurement]
    }));
  };

  // Save preferences when they change
  useEffect(() => {
    saveMeasurementPreferences();
  }, [measurementTrackingEnabled, unitSystem, enabledMeasurements]);

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
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Profile Settings</h2>
                <p className="text-gray-600">Profile settings coming soon.</p>
              </div>
            )}
            
            {activeTab === "preferences" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">App Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">High Contrast Mode</label>
                      <p className="text-xs text-gray-500">Improve visibility with high contrast colors</p>
                    </div>
                    <button
                      onClick={toggleHighContrast}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        highContrast ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          highContrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "measurements" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Measurement Tracking</h2>
                
                <div className="space-y-6">
                  {/* Privacy Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">🔒 Privacy First</h3>
                    <p className="text-sm text-blue-700">
                      Measurement tracking is completely optional. Your data is stored securely and only you can access it. 
                      You can disable tracking or delete your data at any time.
                    </p>
                  </div>

                  {/* Main Toggle */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Measurement Tracking</label>
                      <p className="text-xs text-gray-500">Track body measurements and progress over time</p>
                    </div>
                    <button
                      onClick={toggleMeasurementTracking}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        measurementTrackingEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          measurementTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {measurementTrackingEnabled && (
                    <>
                      {/* Unit System */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Unit System</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="imperial"
                              checked={unitSystem === 'imperial'}
                              onChange={(e) => setUnitSystem(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">Imperial (lbs, inches)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="metric"
                              checked={unitSystem === 'metric'}
                              onChange={(e) => setUnitSystem(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">Metric (kg, cm)</span>
                          </label>
                        </div>
                      </div>

                      {/* Measurement Selection */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-700 mb-3 block">Choose Measurements to Track</label>
                        <div className="space-y-3">
                          {Object.entries(enabledMeasurements).map(([key, enabled]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">
                                {key === 'bodyFat' ? 'Body Fat %' : key}
                                {key === 'weight' && ` (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
                                {['chest', 'waist', 'arms'].includes(key) && ` (${unitSystem === 'imperial' ? 'inches' : 'cm'})`}
                              </span>
                              <button
                                onClick={() => toggleMeasurement(key as keyof typeof enabledMeasurements)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  enabled ? 'bg-green-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                    enabled ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data Control */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Data Control</h3>
                        <div className="space-y-2">
                          <button className="text-sm text-blue-600 hover:text-blue-800 underline">
                            Export My Data
                          </button>
                          <button className="text-sm text-red-600 hover:text-red-800 underline block">
                            Delete All Measurement Data
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "advanced" && userTier > 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Advanced Settings</h2>
                <p className="text-gray-600">Advanced features for Momentum/Mastery users.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 