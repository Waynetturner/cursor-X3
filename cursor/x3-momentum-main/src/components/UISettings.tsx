
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Volume2, History } from 'lucide-react';
import { useUISettings, WorkoutHistoryRange } from '@/hooks/useUISettings';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface UISettingsProps {
  isOpen: boolean;
}

const VOICE_OPTIONS = [
  { 
    id: 'male', 
    name: 'Male', 
    description: 'Clear and confident'
  },
  { 
    id: 'female', 
    name: 'Female', 
    description: 'Warm and engaging'
  }
];

export const UISettings = ({ isOpen }: UISettingsProps) => {
  const { settings, isLoading, handleSave, updateSetting } = useUISettings(isOpen);
  const { speak, isSupported, preloadVoice } = useTextToSpeech();

  const testVoice = async () => {
    if (settings.voice_preference) {
      await speak("This is a test of your selected voice preference", settings.voice_preference);
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
    updateSetting('voice_preference', voiceId);
    
    // Only preload if audio notifications are enabled
    if (settings.audio_notifications_enabled) {
      try {
        await preloadVoice(voiceId);
      } catch (error) {
        console.warn('Failed to preload voice:', error);
      }
    }
  };

  const workoutHistoryOptions = [
    { value: 'last-two' as WorkoutHistoryRange, label: 'Last 2 Workouts' },
    { value: 'week' as WorkoutHistoryRange, label: 'Past Week' },
    { value: 'month' as WorkoutHistoryRange, label: 'Past Month' },
    { value: 'six-months' as WorkoutHistoryRange, label: 'Past 6 Months' },
    { value: 'all' as WorkoutHistoryRange, label: 'All Workouts' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Notifications
          </CardTitle>
          <CardDescription>
            Configure high-quality AI voice notifications powered by OpenAI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="audio-enabled">Enable audio notifications</Label>
            <Switch
              id="audio-enabled"
              checked={settings.audio_notifications_enabled}
              onCheckedChange={(checked) => updateSetting('audio_notifications_enabled', checked)}
            />
          </div>

          {settings.audio_notifications_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="voice-select">Voice preference</Label>
                <Select
                  value={settings.voice_preference}
                  onValueChange={handleVoiceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex flex-col">
                          <span>{voice.name}</span>
                          {voice.description && (
                            <span className="text-xs text-muted-foreground">
                              {voice.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={testVoice}
                variant="outline"
                size="sm"
                disabled={!isSupported}
                className="w-full"
              >
                Test Voice
              </Button>

              <p className="text-sm text-muted-foreground">
                High-quality AI voices powered by OpenAI. Audio is cached locally for faster playback.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workout History Display
          </CardTitle>
          <CardDescription>
            Choose the default time range for viewing your workout history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="history-default">Default view</Label>
            <Select
              value={settings.workout_history_default}
              onValueChange={(value: WorkoutHistoryRange) => updateSetting('workout_history_default', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default range" />
              </SelectTrigger>
              <SelectContent>
                {workoutHistoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save UI Settings'}
      </Button>
    </div>
  );
};
