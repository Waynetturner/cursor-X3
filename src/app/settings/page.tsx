'use client'

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useSubscription, TIER_NAMES, TIER_DESCRIPTIONS, TIER_PRICING, TIER_PRICING_ANNUAL } from '@/contexts/SubscriptionContext';
import { Crown, Star, Zap, CheckCircle, Lock } from 'lucide-react';

const tabs = [
  { label: "Profile", value: "profile" },
  { label: "Subscription", value: "subscription" },
  { label: "Preferences", value: "preferences" },
  { label: "Measurements", value: "measurements" },
  { label: "Advanced", value: "advanced" },
];

export default function Settings() {
  const { tier, features, hasFeature, upgradeTo } = useSubscription();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const [user, setUser] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
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
    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    setDarkMode(darkModePreference);
    
    // Load user and measurement preferences
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    <AppLayout title="Settings">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">App <span className="brand-fire">Settings</span></h1>
          <p className="text-gray-400 mt-2">Customize your X3 Momentum Pro experience</p>
        </header>
        <main>
          <div className="flex border-b border-orange-400 mb-6">
            {tabs.filter(tab => 
              // Hide Advanced tab for Foundation and Momentum users
              tab.value === 'advanced' ? tier === 'mastery' : true
            ).map((tab) => (
              <button
                key={tab.value}
                className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-200 ${
                  activeTab === tab.value
                    ? "border-b-4 border-orange-400 text-orange-400"
                    : "text-gray-400 hover:text-orange-400"
                }`}
                onClick={() => setActiveTab(tab.value)}
                aria-selected={activeTab === tab.value}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="brand-card text-gray-100 rounded-xl shadow-lg p-6 min-h-[200px]">
            {activeTab === "profile" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 brand-fire">Profile Settings</h2>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* X3 Journey Details */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">X3 Journey</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">X3 Start Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Experience</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                          <option value="">Select experience level</option>
                          <option value="beginner">Beginner (0-1 years)</option>
                          <option value="intermediate">Intermediate (1-3 years)</option>
                          <option value="advanced">Advanced (3+ years)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Goals & Preferences */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Goals & Motivation</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                          <option value="">Select your primary goal</option>
                          <option value="strength">Build Strength</option>
                          <option value="muscle">Build Muscle</option>
                          <option value="endurance">Improve Endurance</option>
                          <option value="general">General Fitness</option>
                          <option value="weight-loss">Weight Loss</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Workout Days</label>
                        <div className="flex flex-wrap gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <button
                              key={day}
                              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors"
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subscription" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 brand-fire">Subscription & Pricing</h2>
                
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {tier === 'foundation' && <Zap size={20} className="text-orange-400" />}
                      {tier === 'momentum' && <Star size={20} className="text-orange-400" />}
                      {tier === 'mastery' && <Crown size={20} className="text-orange-400" />}
                      <h3 className="font-medium text-orange-400">Current Plan: {TIER_NAMES[tier]}</h3>
                    </div>
                    <p className="text-sm text-orange-300 mb-2">
                      {TIER_DESCRIPTIONS[tier]}
                    </p>
                    <p className="text-sm text-orange-300">
                      ${TIER_PRICING[tier]}/month • ${TIER_PRICING_ANNUAL[tier]}/year
                    </p>
                  </div>

                  {/* Features Overview */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Your Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-sm text-gray-700">
                          Workout History: {features.maxWorkoutHistory === -1 ? 'Unlimited' : `${features.maxWorkoutHistory} days`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasFeature('aiCoachAccess') ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        <span className={`text-sm ${hasFeature('aiCoachAccess') ? 'text-gray-700' : 'text-gray-400'}`}>
                          AI Coach Access
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasFeature('advancedAnalytics') ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        <span className={`text-sm ${hasFeature('advancedAnalytics') ? 'text-gray-700' : 'text-gray-400'}`}>
                          Advanced Analytics
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasFeature('measurementTracking') ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        <span className={`text-sm ${hasFeature('measurementTracking') ? 'text-gray-700' : 'text-gray-400'}`}>
                          Measurement Tracking
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasFeature('exportData') ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        <span className={`text-sm ${hasFeature('exportData') ? 'text-gray-700' : 'text-gray-400'}`}>
                          Export Data
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasFeature('prioritySupport') ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        <span className={`text-sm ${hasFeature('prioritySupport') ? 'text-gray-700' : 'text-gray-400'}`}>
                          Priority Support
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Management */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-700">Plan Management</h3>
                      {/* Billing Period Toggle */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setBillingPeriod('monthly')}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            billingPeriod === 'monthly'
                              ? 'bg-white text-orange-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingPeriod('annual')}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            billingPeriod === 'annual'
                              ? 'bg-white text-orange-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Annual
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Foundation Plan */}
                      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        tier === 'foundation' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={20} className="text-orange-400" />
                          <h4 className="font-medium text-gray-800">Foundation</h4>
                          {tier === 'foundation' && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">Current</span>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Essential X3 tracking features</p>
                        <p className="text-lg font-bold text-gray-800 mb-3">
                          ${billingPeriod === 'monthly' ? TIER_PRICING.foundation : TIER_PRICING_ANNUAL.foundation}
                          <span className="text-sm font-normal text-gray-600">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        </p>
                        {tier !== 'foundation' && (
                          <button
                            onClick={() => upgradeTo('foundation')}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Downgrade to Foundation
                          </button>
                        )}
                      </div>

                      {/* Momentum Plan */}
                      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        tier === 'momentum' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Star size={20} className="text-orange-400" />
                          <h4 className="font-medium text-gray-800">Momentum</h4>
                          {tier === 'momentum' && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">Current</span>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">AI coaching, analytics, and tracking</p>
                        <p className="text-lg font-bold text-gray-800 mb-3">
                          ${billingPeriod === 'monthly' ? TIER_PRICING.momentum : TIER_PRICING_ANNUAL.momentum}
                          <span className="text-sm font-normal text-gray-600">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        </p>
                        {tier === 'foundation' && (
                          <button
                            onClick={() => upgradeTo('momentum')}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Upgrade to Momentum
                          </button>
                        )}
                        {tier === 'mastery' && (
                          <button
                            onClick={() => upgradeTo('momentum')}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Downgrade to Momentum
                          </button>
                        )}
                      </div>

                      {/* Mastery Plan */}
                      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        tier === 'mastery' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Crown size={20} className="text-orange-400" />
                          <h4 className="font-medium text-gray-800">Mastery</h4>
                          {tier === 'mastery' && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">Current</span>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Complete X3 experience with premium features</p>
                        <p className="text-lg font-bold text-gray-800 mb-3">
                          ${billingPeriod === 'monthly' ? TIER_PRICING.mastery : TIER_PRICING_ANNUAL.mastery}
                          <span className="text-sm font-normal text-gray-600">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        </p>
                        {tier !== 'mastery' && (
                          <button
                            onClick={() => upgradeTo('mastery')}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Upgrade to Mastery
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MVP Testing Notice */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="font-medium text-blue-400 mb-2">🚀 MVP Testing</h3>
                    <p className="text-sm text-blue-300">
                      You&apos;re helping us test our subscription tiers! Changes are saved locally and will sync when payments are integrated.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "preferences" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 brand-fire">App Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-300 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dark Mode</label>
                      <p className="text-xs text-gray-500">Toggle between light and dark themes</p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        darkMode ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-300 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notification Sounds</label>
                      <p className="text-xs text-gray-500">Play sounds for workout notifications</p>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-300 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto-save Workouts</label>
                      <p className="text-xs text-gray-500">Automatically save workout data</p>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "measurements" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 brand-fire">Measurement Tracking</h2>
                
                {!hasFeature('measurementTracking') && (
                  <div className="text-center py-8">
                    <Lock size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Measurement Tracking Locked</h3>
                    <p className="text-gray-600 mb-4">
                      Upgrade to Momentum or Mastery to track your body measurements and progress over time.
                    </p>
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      View Subscription Plans
                    </button>
                  </div>
                )}
                
                {hasFeature('measurementTracking') && (
                <div className="space-y-6">
                  {/* Privacy Notice */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="font-medium text-blue-400 mb-2">🔒 Privacy First</h3>
                    <p className="text-sm text-blue-300">
                      Measurement tracking is completely optional. Your data is stored securely and only you can access it. 
                      You can disable tracking or delete your data at any time.
                    </p>
                  </div>

                  {/* Main Toggle */}
                  <div className="flex items-center justify-between p-4 border border-gray-600 bg-gray-700/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-200">Enable Measurement Tracking</label>
                      <p className="text-xs text-gray-400">Track body measurements and progress over time</p>
                    </div>
                    <button
                      onClick={toggleMeasurementTracking}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        measurementTrackingEnabled ? 'bg-orange-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                          measurementTrackingEnabled ? 'bg-gray-900 translate-x-6' : 'bg-white translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {measurementTrackingEnabled && (
                    <>
                      {/* Unit System */}
                      <div className="p-4 border border-gray-600 bg-gray-700/50 rounded-lg">
                        <label className="text-sm font-medium text-gray-200 mb-2 block">Unit System</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="imperial"
                              checked={unitSystem === 'imperial'}
                              onChange={(e) => setUnitSystem(e.target.value)}
                              className="mr-2 text-orange-400"
                            />
                            <span className="text-sm text-gray-300">Imperial (lbs, inches)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="metric"
                              checked={unitSystem === 'metric'}
                              onChange={(e) => setUnitSystem(e.target.value)}
                              className="mr-2 text-orange-400"
                            />
                            <span className="text-sm text-gray-300">Metric (kg, cm)</span>
                          </label>
                        </div>
                      </div>

                      {/* Measurement Selection */}
                      <div className="p-4 border border-gray-600 bg-gray-700/50 rounded-lg">
                        <label className="text-sm font-medium text-gray-200 mb-3 block">Choose Measurements to Track</label>
                        <div className="space-y-3">
                          {Object.entries(enabledMeasurements).map(([key, enabled]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-300 capitalize">
                                {key === 'bodyFat' ? 'Body Fat %' : key}
                                {key === 'weight' && ` (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
                                {['chest', 'waist', 'arms'].includes(key) && ` (${unitSystem === 'imperial' ? 'inches' : 'cm'})`}
                              </span>
                              <button
                                onClick={() => toggleMeasurement(key as keyof typeof enabledMeasurements)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  enabled ? 'bg-orange-500' : 'bg-gray-600'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                                    enabled ? 'bg-gray-900 translate-x-5' : 'bg-white translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Current Measurements */}
                      {Object.values(enabledMeasurements).some(enabled => enabled) && (
                        <div className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-700 mb-4">Record Your Measurements</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(enabledMeasurements).map(([key, enabled]) => 
                              enabled && (
                                <div key={key}>
                                  <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                                    {key === 'bodyFat' ? 'Body Fat %' : key}
                                    {key === 'weight' && ` (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
                                    {['chest', 'waist', 'arms'].includes(key) && ` (${unitSystem === 'imperial' ? 'inches' : 'cm'})`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    placeholder={`Enter ${key} measurement`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  />
                                </div>
                              )
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                              Save Measurements
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                              Measurements are saved with today&apos;s date. You can track changes over time in your progress charts.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Measurement History */}
                      {Object.values(enabledMeasurements).some(enabled => enabled) && (
                        <div className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Measurements</h3>
                          <div className="text-sm text-gray-500 text-center py-4">
                            No measurements recorded yet. Add your first measurement above.
                          </div>
                        </div>
                      )}

                      {/* Data Control */}
                      <div className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Data Control</h3>
                        <div className="space-y-2">
                          <button className="text-sm text-blue-600 hover:text-blue-500 underline">
                            Export My Data
                          </button>
                          <button className="text-sm text-red-600 hover:text-red-500 underline block">
                            Delete All Measurement Data
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>
            )}

            {activeTab === "advanced" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 brand-fire">Advanced Settings</h2>
                
                {hasFeature('advancedAnalytics') ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">Advanced features for {TIER_NAMES[tier]} users.</p>
                    
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-300 bg-white rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-2">Data Export</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Export your workout data in various formats for external analysis.
                        </p>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Export Workout Data
                        </button>
                      </div>
                      
                      {hasFeature('apiAccess') && (
                        <div className="p-4 border border-gray-300 bg-white rounded-lg">
                          <h3 className="font-medium text-gray-800 mb-2">API Access</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Connect third-party apps and services to your X3 data.
                          </p>
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Manage API Keys
                          </button>
                        </div>
                      )}
                      
                      {hasFeature('prioritySupport') && (
                        <div className="p-4 border border-gray-300 bg-white rounded-lg">
                          <h3 className="font-medium text-gray-800 mb-2">Priority Support</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Get faster response times and dedicated support channels.
                          </p>
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Contact Priority Support
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lock size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Advanced Features Locked</h3>
                    <p className="text-gray-600 mb-4">
                      Upgrade to Momentum or Mastery to access advanced settings and features.
                    </p>
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      View Subscription Plans
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
} 