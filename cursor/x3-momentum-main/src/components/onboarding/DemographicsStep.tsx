
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserDemographics } from '@/types/demographics';
import { User } from 'lucide-react';

interface DemographicsStepProps {
  demographics: UserDemographics;
  updateField: (field: keyof UserDemographics, value: string | number) => void;
  onSkipDemographics?: () => void;
}

export const DemographicsStep = ({ demographics, updateField, onSkipDemographics }: DemographicsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell Us About Yourself
        </h2>
        <p className="text-gray-600">
          This helps us provide better coaching and track your progress more effectively.
          <br />
          <span className="text-sm text-gray-500">(You can skip this and fill it out later in settings)</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={demographics.age || ''}
              onChange={(e) => updateField('age', parseInt(e.target.value) || undefined)}
              placeholder="Enter your age"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={demographics.gender || ''} onValueChange={(value) => updateField('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fitness_level">Current Fitness Level</Label>
            <Select value={demographics.fitness_level || ''} onValueChange={(value) => updateField('fitness_level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select fitness level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goals">Primary Goals</Label>
            <Textarea
              id="goals"
              value={demographics.goals || ''}
              onChange={(e) => updateField('goals', e.target.value)}
              placeholder="e.g., Build muscle, lose fat, get stronger..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="injury_history">Any Injuries or Limitations?</Label>
            <Textarea
              id="injury_history"
              value={demographics.injury_history || ''}
              onChange={(e) => updateField('injury_history', e.target.value)}
              placeholder="Any injuries or physical limitations we should know about?"
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          💡 <strong>Pro tip:</strong> The more information you provide, the better our AI coach can 
          personalize your training recommendations and progression suggestions.
        </p>
      </div>
    </div>
  );
};
