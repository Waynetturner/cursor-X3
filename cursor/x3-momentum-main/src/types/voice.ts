
export type VoiceOption = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description?: string;
};

export const VOICE_OPTIONS: VoiceOption[] = [
  { 
    id: 'male', 
    name: 'Male', 
    gender: 'male',
    description: 'Clear and confident'
  },
  { 
    id: 'female', 
    name: 'Female', 
    gender: 'female',
    description: 'Warm and engaging'
  }
];
