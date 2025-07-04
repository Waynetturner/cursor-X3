
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import { DemographicsForm } from './DemographicsForm';
import { ExerciseSettings } from './ExerciseSettings';
import { UISettings } from './UISettings';
import { useDemographics } from '@/hooks/useDemographics';

export const UserSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { demographics, isLoading, handleSave, updateField } = useDemographics(isOpen);

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="demographics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demographics">Profile</TabsTrigger>
            <TabsTrigger value="exercises">Exercise Settings</TabsTrigger>
            <TabsTrigger value="interface">Interface</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demographics" className="space-y-4">
            <DemographicsForm demographics={demographics} updateField={updateField} />
            <Button onClick={onSave} disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </TabsContent>
          
          <TabsContent value="exercises" className="space-y-4">
            <ExerciseSettings />
          </TabsContent>

          <TabsContent value="interface" className="space-y-4">
            <UISettings isOpen={isOpen} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
