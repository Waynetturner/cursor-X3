'use client'

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useSubscription, TIER_NAMES, TIER_DESCRIPTIONS, TIER_PRICING, TIER_PRICING_ANNUAL } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Crown, Star, Zap, CheckCircle, Lock } from 'lucide-react';
import SimpleTTSTester from '@/components/SimpleTTSTester';
import TestModeSettings from '@/components/TestModeSettings';
import TTSSettings from '@/components/TTSSettings/TTSSettings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const tabs = [
  { label: "Profile", value: "profile" },
  { label: "Subscription", value: "subscription" },
  { label: "Preferences", value: "preferences" },
  { label: "Advanced", value: "advanced" },
];

export default function Settings() {
  const { tier, features, hasFeature, upgradeTo } = useSubscription();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const [user, setUser] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: '',
    startDate: '',
    fitnessExperience: '',
    primaryGoal: '',
    birthYear: '',
    biologicalSex: '',
    heightInches: '',
    heightCm: '',
    weightLbs: '',
    weightKg: '',
    activityLevelBeforeX3: '',
    resistanceTrainingBackground: '',
    x3EquipmentAvailable: [] as string[],
    programTimelineGoal: '',
    coachingStylePreference: 'balanced',
    healthConsiderations: '',
    timezone: '',
    unitSystem: 'imperial' // for height/weight display preference
  });
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [ttsSettingsOpen, setTtsSettingsOpen] = useState(false);

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Load profile data from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Load demographics data from user_demographics table  
        const { data: demographics } = await supabase
          .from('user_demographics')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // Combine data from both tables
        const displayName = profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`.trim()
          : profile?.first_name || '';

        setProfileData({
          displayName,
          startDate: profile?.x3_start_date || '',
          fitnessExperience: demographics?.fitness_level || '',
          primaryGoal: demographics?.goals || '',
          birthYear: demographics?.age ? (new Date().getFullYear() - demographics.age).toString() : '',
          biologicalSex: demographics?.gender === 'male' ? 'male' : 
                         demographics?.gender === 'female' ? 'female' : '',
          heightInches: '',
          heightCm: '',
          weightLbs: '', 
          weightKg: '',
          activityLevelBeforeX3: '',
          resistanceTrainingBackground: '',
          x3EquipmentAvailable: demographics?.available_equipment ? 
            demographics.available_equipment.split(',').map((s: string) => s.trim()) : [],
          programTimelineGoal: demographics?.session_length || '',
          coachingStylePreference: demographics?.coach_tone || 'balanced',
          healthConsiderations: demographics?.injury_history || '',
          timezone: demographics?.timezone || profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          unitSystem: 'imperial'
        });
      }
    };
    
    loadUserData();
  }, []);

  const saveProfileData = async () => {
    if (!user) return;
    
    setProfileSaveLoading(true);
    setProfileSaveStatus('idle');
    
    try {
      // Update profiles table (basic info)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profileData.displayName.split(' ')[0] || null,
          last_name: profileData.displayName.split(' ').slice(1).join(' ') || null,
          x3_start_date: profileData.startDate || null,
          timezone: profileData.timezone || null
        });
      
      if (profileError) {
        console.error('Profiles table error:', profileError);
        throw profileError;
      }

      // Update user_demographics table
      const { error: demoError } = await supabase
        .from('user_demographics')
        .upsert({
          user_id: user.id,
          age: profileData.birthYear ? new Date().getFullYear() - parseInt(profileData.birthYear) : null,
          gender: profileData.biologicalSex === 'male' ? 'male' : 
                 profileData.biologicalSex === 'female' ? 'female' : null,
          fitness_level: profileData.fitnessExperience || null,
          goals: profileData.primaryGoal || null,
          available_equipment: profileData.x3EquipmentAvailable.length > 0 ? profileData.x3EquipmentAvailable.join(',') : null,
          session_length: profileData.programTimelineGoal || null,
          coach_tone: profileData.coachingStylePreference || 'balanced',
          injury_history: profileData.healthConsiderations || null,
          language: 'en',
          timezone: profileData.timezone || null
        }, { onConflict: 'user_id' });

      if (demoError) {
        console.error('Demographics table error:', demoError);
        throw demoError;
      }

      setProfileSaveStatus('success');
      setTimeout(() => setProfileSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setProfileSaveStatus('error');
      setTimeout(() => setProfileSaveStatus('idle'), 3000);
    } finally {
      setProfileSaveLoading(false);
    }
  };

  const updateProfileField = (field: string, value: string | string[]) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (equipment: string) => {
    setProfileData(prev => ({
      ...prev,
      x3EquipmentAvailable: prev.x3EquipmentAvailable.includes(equipment)
        ? prev.x3EquipmentAvailable.filter(e => e !== equipment)
        : [...prev.x3EquipmentAvailable, equipment]
    }));
  };

  return (
    <ProtectedRoute>
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
                            value={profileData.displayName}
                            onChange={(e) => updateProfileField('displayName', e.target.value)}
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
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Contact support if needed.</p>
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
                            value={profileData.startDate}
                            onChange={(e) => updateProfileField('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Experience</label>
                          <select 
                            value={profileData.fitnessExperience}
                            onChange={(e) => updateProfileField('fitnessExperience', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Select experience level</option>
                            <option value="beginner">Beginner (0-1 years)</option>
                            <option value="intermediate">Intermediate (1-3 years)</option>
                            <option value="advanced">Advanced (3+ years)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={saveProfileData}
                          disabled={profileSaveLoading}
                          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          {profileSaveLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {profileSaveLoading ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                        
                        {profileSaveStatus === 'success' && (
                          <span className="text-green-600 text-sm font-medium">✓ Profile saved successfully!</span>
                        )}
                        {profileSaveStatus === 'error' && (
                          <span className="text-red-600 text-sm font-medium">✗ Failed to save profile</span>
                        )}
                      </div>
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
                          {hasFeature('exportData') ? (
                            <CheckCircle size={16} className="text-green-400" />
                          ) : (
                            <Lock size={16} className="text-gray-400" />
                          )}
                          <span className={`text-sm ${hasFeature('exportData') ? 'text-gray-700' : 'text-gray-400'}`}>
                            Export Data
                          </span>
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
                  
                  <div className="space-y-6">
                    {/* Theme Settings */}
                    <div className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-3">Appearance</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Dark Mode</label>
                          <p className="text-xs text-gray-500">Toggle between light and dark themes</p>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isDark ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                        >
                          <span 
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isDark ? 'translate-x-6' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                      </div>
                    </div>

                    {/* TTS Settings */}
                    {hasFeature('ttsAudioCues') && (
                      <div className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-700">Text-to-Speech Settings</h3>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            🎵 {tier === 'mastery' ? 'Premium Voices' : 'Standard Voices'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Configure voice settings for workout audio cues, rest timer, and AI coach responses.
                        </p>
                        <button
                          onClick={() => setTtsSettingsOpen(true)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Configure Voice Settings
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 brand-fire">Advanced Settings</h2>
                  
                  {hasFeature('advancedAnalytics') ? (
                    <div className="space-y-6">
                      <p className="text-gray-600 mb-4">Advanced features for {TIER_NAMES[tier]} users.</p>
                      
                      {/* Test Mode Settings */}
                      <div className="p-4 border border-gray-300 bg-white rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-2">Developer Test Mode</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Safe testing environment for development and feature testing without affecting production data.
                        </p>
                        <TestModeSettings />
                      </div>
                      
                      {/* TTS Testing */}
                      <div className="p-4 border border-gray-300 bg-white rounded-lg">
                        <SimpleTTSTester />
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
        
        {/* TTS Settings Modal */}
        <TTSSettings 
          isOpen={ttsSettingsOpen}
          onClose={() => setTtsSettingsOpen(false)}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
