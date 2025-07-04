
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Lock, Eye } from 'lucide-react';

interface DataPrivacyStepProps {
  privacyAccepted: boolean;
  setPrivacyAccepted: (accepted: boolean) => void;
}

export const DataPrivacyStep = ({ privacyAccepted, setPrivacyAccepted }: DataPrivacyStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Privacy Matters
        </h2>
        <p className="text-gray-600">
          We take your data security seriously. Here's how we protect your information:
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Secure Storage</h3>
          <p className="text-sm text-gray-600">
            All data is encrypted and stored securely in compliance with privacy standards
          </p>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Your Data Only</h3>
          <p className="text-sm text-gray-600">
            We never share your personal information with third parties
          </p>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Full Control</h3>
          <p className="text-sm text-gray-600">
            You can export or delete your data at any time
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">What we collect:</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>• <strong>Workout data:</strong> Exercise sets, reps, and resistance levels to track your progress</li>
          <li>• <strong>Demographics (optional):</strong> Age, fitness level, and goals to personalize your experience</li>
          <li>• <strong>Usage data:</strong> App interactions to improve features and user experience</li>
        </ul>
        
        <h3 className="font-semibold text-gray-900 mb-3 mt-4">What we DON'T collect:</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>• Personal identifying information beyond your email</li>
          <li>• Location data or device information</li>
          <li>• Any data from other apps or services</li>
        </ul>
      </div>

      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <Checkbox
          id="privacy-consent"
          checked={privacyAccepted}
          onCheckedChange={setPrivacyAccepted}
        />
        <label htmlFor="privacy-consent" className="text-sm text-gray-700 cursor-pointer">
          I understand and agree to PapaFit X3's data collection practices. I consent to the collection 
          and processing of my workout data to provide personalized fitness tracking and coaching features.
        </label>
      </div>
    </div>
  );
};
