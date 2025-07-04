
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserDemographics } from '@/types/demographics';

interface DemographicsFormProps {
  demographics: UserDemographics;
  updateField: (field: keyof UserDemographics, value: string | number) => void;
}

export const DemographicsForm = ({ demographics, updateField }: DemographicsFormProps) => {
  return (
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
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={demographics.location || ''}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder="City, Country"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fitness_level">Fitness Level</Label>
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

      <div className="space-y-2">
        <Label htmlFor="x3_program">X3 Program</Label>
        <Select value={demographics.x3_program || ''} onValueChange={(value) => updateField('x3_program', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select X3 program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12-week">12-Week Program</SelectItem>
            <SelectItem value="maintenance">Maintenance Phase</SelectItem>
            <SelectItem value="custom">Custom Program</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goals">Goals</Label>
        <Textarea
          id="goals"
          value={demographics.goals || ''}
          onChange={(e) => updateField('goals', e.target.value)}
          placeholder="What are your fitness goals?"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="injury_history">Injury History</Label>
        <Textarea
          id="injury_history"
          value={demographics.injury_history || ''}
          onChange={(e) => updateField('injury_history', e.target.value)}
          placeholder="Any injuries or physical limitations?"
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
};
