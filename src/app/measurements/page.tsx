'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Save, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface MeasurementData {
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  arms?: number;
  notes?: string;
}

export default function MeasurementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Settings from localStorage
  const [measurementTrackingEnabled, setMeasurementTrackingEnabled] = useState(false);
  const [unitSystem, setUnitSystem] = useState('imperial');
  const [enabledMeasurements, setEnabledMeasurements] = useState({
    weight: false,
    bodyFat: false,
    chest: false,
    waist: false,
    arms: false
  });

  // Measurement data
  const [measurements, setMeasurements] = useState<MeasurementData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastMeasurements, setLastMeasurements] = useState<MeasurementData | null>(null);

  useEffect(() => {
    // Load user and settings
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Load measurement preferences
        const measurementEnabled = localStorage.getItem('measurementTrackingEnabled') === 'true';
        const units = localStorage.getItem('unitSystem') || 'imperial';
        const enabled = JSON.parse(localStorage.getItem('enabledMeasurements') || '{"weight":false,"bodyFat":false,"chest":false,"waist":false,"arms":false}');
        
        setMeasurementTrackingEnabled(measurementEnabled);
        setUnitSystem(units);
        setEnabledMeasurements(enabled);

        // Load last measurements for reference
        if (measurementEnabled) {
          const { data: lastData } = await supabase
            .from('user_measurements')
            .select('*')
            .eq('user_id', user.id)
            .order('measurement_date', { ascending: false })
            .limit(1)
            .single();
          
          if (lastData) {
            setLastMeasurements({
              weight: lastData.weight,
              bodyFat: lastData.body_fat_percentage,
              chest: lastData.chest,
              waist: lastData.waist,
              arms: lastData.arms
            });
          }
        }
      }
    };

    loadData();
  }, []);

  const handleMeasurementChange = (field: keyof MeasurementData, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setMeasurements(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const saveMeasurements = async () => {
    if (!user || !measurementTrackingEnabled) return;

    setIsSaving(true);
    
    try {
      const dataToSave = {
        user_id: user.id,
        measurement_date: new Date().toISOString().split('T')[0], // Today's date
        weight: measurements.weight || null,
        body_fat_percentage: measurements.bodyFat || null,
        chest: measurements.chest || null,
        waist: measurements.waist || null,
        arms: measurements.arms || null,
        notes: measurements.notes || null
      };

      const { data, error } = await supabase
        .from('user_measurements')
        .insert(dataToSave)
        .select();

      if (error) {
        console.error('Error saving measurements:', error);
        alert('Error saving measurements. Please try again.');
      } else {
        console.log('Measurements saved successfully:', data);
        alert('Measurements saved successfully!');
        
        // Update last measurements for reference
        setLastMeasurements(measurements);
        
        // Clear the form
        setMeasurements({});
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving measurements. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getUnitLabel = (measurement: string) => {
    if (measurement === 'weight') {
      return unitSystem === 'imperial' ? 'lbs' : 'kg';
    }
    if (['chest', 'waist', 'arms'].includes(measurement)) {
      return unitSystem === 'imperial' ? 'inches' : 'cm';
    }
    if (measurement === 'bodyFat') {
      return '%';
    }
    return '';
  };

  const getMeasurementLabel = (key: string) => {
    const labels = {
      weight: 'Weight',
      bodyFat: 'Body Fat %',
      chest: 'Chest',
      waist: 'Waist',
      arms: 'Arms'
    };
    return labels[key as keyof typeof labels] || key;
  };

  if (!measurementTrackingEnabled) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
          <div className="container mx-auto px-4 py-8">
            <header className="flex items-center mb-8">
              <button 
                onClick={() => router.back()} 
                className="mr-4 p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" 
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-bold text-white">Measurements</h1>
            </header>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-6xl mb-4">📏</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Measurement Tracking Disabled</h2>
                <p className="text-gray-600 mb-6">
                  Measurement tracking is currently disabled. Enable it in settings to start tracking your progress.
                </p>
                <button
                  onClick={() => router.push('/settings')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const hasEnabledMeasurements = Object.values(enabledMeasurements).some(enabled => enabled);

  if (!hasEnabledMeasurements) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
          <div className="container mx-auto px-4 py-8">
            <header className="flex items-center mb-8">
              <button 
                onClick={() => router.back()} 
                className="mr-4 p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" 
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-bold text-white">Measurements</h1>
            </header>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">No Measurements Selected</h2>
                <p className="text-gray-600 mb-6">
                  You have measurement tracking enabled, but haven&apos;t selected any measurements to track. 
                  Choose which measurements you&apos;d like to track in settings.
                </p>
                <button
                  onClick={() => router.push('/settings')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Choose Measurements
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
        <div className="container mx-auto px-4 py-8">
          <header className="flex items-center mb-8">
            <button 
              onClick={() => router.back()} 
              className="mr-4 p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" 
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-white">Body Measurements</h1>
          </header>
          
          <main className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center mb-6">
                <Calendar className="mr-2 text-blue-500" size={20} />
                <span className="text-sm text-gray-600">
                  Today: {new Date().toLocaleDateString()}
                </span>
                <span className="ml-auto text-sm text-gray-500">
                  Units: {unitSystem === 'imperial' ? 'Imperial' : 'Metric'}
                </span>
              </div>

              <div className="space-y-6">
                {Object.entries(enabledMeasurements)
                  .filter(([, enabled]) => enabled)
                  .map(([key]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {getMeasurementLabel(key)} ({getUnitLabel(key)})
                      </label>
                      
                      <div className="flex space-x-4">
                        <input
                          type="number"
                          step="0.1"
                          value={measurements[key as keyof MeasurementData] || ''}
                          onChange={(e) => handleMeasurementChange(key as keyof MeasurementData, e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter ${getMeasurementLabel(key).toLowerCase()}`}
                        />
                        
                        {lastMeasurements && lastMeasurements[key as keyof MeasurementData] && (
                          <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
                            <TrendingUp size={16} className="mr-1" />
                            Last: {lastMeasurements[key as keyof MeasurementData]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    value={measurements.notes || ''}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add notes about your progress, how you're feeling, etc."
                  />
                </div>
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={saveMeasurements}
                  disabled={isSaving || Object.keys(measurements).filter(key => key !== 'notes' && measurements[key as keyof MeasurementData]).length === 0}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center justify-center"
                >
                  <Save className="mr-2" size={16} />
                  {isSaving ? 'Saving...' : 'Save Measurements'}
                </button>
                
                <button
                  onClick={() => router.push('/settings')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Settings
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}