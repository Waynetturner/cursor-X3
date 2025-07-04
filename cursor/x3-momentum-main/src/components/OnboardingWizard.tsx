
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './onboarding/WelcomeStep';
import { DataPrivacyStep } from './onboarding/DataPrivacyStep';
import { ProgramOverviewStep } from './onboarding/ProgramOverviewStep';
import { DemographicsStep } from './onboarding/DemographicsStep';
import { FirstWorkoutStep } from './onboarding/FirstWorkoutStep';
import { CompletionStep } from './onboarding/CompletionStep';
import { useDemographics } from '@/hooks/useDemographics';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingWizard = ({ isOpen, onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const { demographics, updateField, handleSave, isLoading } = useDemographics(isOpen);

  const steps = [
    { id: 'welcome', title: 'Welcome', component: WelcomeStep },
    { id: 'privacy', title: 'Privacy', component: DataPrivacyStep },
    { id: 'overview', title: 'Program Overview', component: ProgramOverviewStep },
    { id: 'demographics', title: 'Your Profile', component: DemographicsStep },
    { id: 'workout', title: 'First Workout', component: FirstWorkoutStep },
    { id: 'complete', title: 'Complete', component: CompletionStep }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    // Save demographics when leaving the demographics step
    if (currentStep === 3) {
      const success = await handleSave();
      if (!success) return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipDemographics = () => {
    setCurrentStep(4); // Skip to workout step
  };

  const canProceed = () => {
    if (currentStep === 1) return privacyAccepted; // Privacy step
    if (currentStep === 3) return demographics.age || demographics.fitness_level; // Demographics step (at least some info)
    return true;
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Progress Bar */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Getting Started with PapaFit X3</h2>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <CurrentStepComponent
              demographics={demographics}
              updateField={updateField}
              privacyAccepted={privacyAccepted}
              setPrivacyAccepted={setPrivacyAccepted}
              onSkipDemographics={handleSkipDemographics}
            />
          </div>

          {/* Navigation */}
          <div className="p-6 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep === 3 && (
                <Button
                  variant="ghost"
                  onClick={handleSkipDemographics}
                >
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? 'Saving...' : currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
