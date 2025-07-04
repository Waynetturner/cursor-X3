
import { voicePreferences } from './voicePreferences';
import { logAllAvailableVoices } from './voiceLogging';

export const findBestVoice = (voices: SpeechSynthesisVoice[], voiceId: string): SpeechSynthesisVoice | null => {
  console.log('Finding voice for:', voiceId);
  
  // Log all voices first time we search
  logAllAvailableVoices();

  // Note: voicePreferences now contains OpenAI voice mappings, not browser voice names
  // This function is kept for fallback compatibility with Web Speech API if needed
  
  // Special handling for American male - prioritize Mark over David, avoid David as it sounds like narrator
  if (voiceId === 'american-male') {
    // Look for Microsoft Mark specifically (better than David)
    const markVoice = voices.find(voice => 
      voice.name.includes('Microsoft Mark') && 
      voice.lang.includes('en-US')
    );
    if (markVoice) {
      console.log('Found Microsoft Mark voice:', markVoice.name);
      return markVoice;
    }

    // Look for other American male voices, explicitly avoiding David which sounds like narrator
    const americanMaleVoices = voices.filter(voice => {
      const name = voice.name.toLowerCase();
      const isEnglishUS = voice.lang.includes('US') || voice.lang.includes('en-US');
      const isNotDavid = !name.includes('david'); // Explicitly avoid David
      const isNotNarrator = !name.includes('narrator');
      const isMaleVoice = name.includes('male') || 
                         name.includes('man') ||
                         name.includes('mark') ||
                         name.includes('alex') ||
                         name.includes('daniel') ||
                         name.includes('fred');
      
      return isEnglishUS && isNotDavid && isNotNarrator && (isMaleVoice || !name.includes('female'));
    });

    if (americanMaleVoices.length > 0) {
      console.log('Found American male voice (not David):', americanMaleVoices[0].name);
      return americanMaleVoices[0];
    }

    // If no other options, reluctantly use David but log it
    const davidVoice = voices.find(voice => 
      voice.name.includes('Microsoft David') && 
      voice.lang.includes('en-US')
    );
    if (davidVoice) {
      console.log('Fallback to David voice (may sound like narrator):', davidVoice.name);
      return davidVoice;
    }
  }

  // Special handling for British male - prioritize Thomas and avoid child voices
  if (voiceId === 'british-male') {
    // Look for Thomas specifically
    const thomasVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('thomas') && 
      (voice.lang.includes('GB') || voice.lang.includes('en-GB'))
    );
    if (thomasVoice) {
      console.log('Found Thomas voice:', thomasVoice.name);
      return thomasVoice;
    }

    // Look for other British male voices, avoiding child voices
    const childVoiceNames = ['maisie', 'child', 'kids', 'young'];
    const britishMaleVoices = voices.filter(voice => {
      const name = voice.name.toLowerCase();
      const isEnglishGB = voice.lang.includes('GB') || voice.lang.includes('en-GB');
      const isNotChildVoice = !childVoiceNames.some(childName => name.includes(childName));
      const isMaleVoice = name.includes('male') || 
                         name.includes('man') ||
                         name.includes('george') ||
                         name.includes('ryan') ||
                         name.includes('oliver') ||
                         name.includes('daniel') ||
                         name.includes('david') ||
                         name.includes('mark');
      
      return isEnglishGB && isNotChildVoice && (isMaleVoice || !name.includes('female'));
    });

    if (britishMaleVoices.length > 0) {
      console.log('Found British male voice:', britishMaleVoices[0].name);
      return britishMaleVoices[0];
    }
  }

  // Fallback: filter by language and gender with improved detection
  const isTargetFemale = voiceId.includes('female');
  const targetLang = voiceId.includes('british') ? 'en-GB' : 'en-US';
  
  const filteredVoices = voices.filter(voice => {
    const matchesLang = voice.lang.startsWith(targetLang) || 
                       (voiceId.includes('british') && voice.lang.includes('GB'));
    const voiceName = voice.name.toLowerCase();
    
    // Avoid child voices and David for American male
    const childVoiceNames = ['maisie', 'child', 'kids', 'young'];
    const isNotChildVoice = !childVoiceNames.some(childName => voiceName.includes(childName));
    const isNotDavid = voiceId === 'american-male' ? !voiceName.includes('david') : true;
    
    // Improved gender detection - explicit female voice names
    const femaleNames = [
      'female', 'woman', 'zira', 'eva', 'susan', 'hazel', 'libby', 
      'samantha', 'victoria', 'karen', 'kate', 'serena', 'anna', 
      'bella', 'emma', 'jenny', 'maria', 'natasha', 'tessa'
    ];
    
    // Explicit male voice names
    const maleNames = [
      'male', 'man', 'mark', 'alex', 'daniel', 'fred', 
      'george', 'ryan', 'oliver', 'james', 'john', 'michael', 
      'thomas', 'william', 'richard', 'charles', 'christopher'
    ];
    
    const isFemaleVoice = femaleNames.some(name => voiceName.includes(name));
    const isMaleVoice = maleNames.some(name => voiceName.includes(name));
    
    let genderMatch = false;
    if (isTargetFemale) {
      genderMatch = isFemaleVoice || (!isMaleVoice && voiceName.includes('female'));
    } else {
      genderMatch = isMaleVoice || (!isFemaleVoice && !voiceName.includes('female'));
    }
    
    return matchesLang && genderMatch && isNotChildVoice && isNotDavid;
  });

  if (filteredVoices.length > 0) {
    console.log('Found filtered voice:', filteredVoices[0].name);
    return filteredVoices[0];
  }

  // Last resort: any voice with the right language, preferring the right gender, avoiding child voices
  const langMatches = voices.filter(voice => {
    const matchesLang = voice.lang.startsWith(targetLang) || 
                       (voiceId.includes('british') && voice.lang.includes('GB'));
    const voiceName = voice.name.toLowerCase();
    const childVoiceNames = ['maisie', 'child', 'kids', 'young'];
    const isNotChildVoice = !childVoiceNames.some(childName => voiceName.includes(childName));
    
    return matchesLang && isNotChildVoice;
  });
  
  if (langMatches.length > 0) {
    // Try to find one that doesn't obviously conflict with gender
    const genderNeutral = langMatches.find(voice => {
      const name = voice.name.toLowerCase();
      if (isTargetFemale) {
        return !name.includes('male') && !name.includes('man');
      } else {
        return !name.includes('female') && !name.includes('woman');
      }
    });
    
    const selectedVoice = genderNeutral || langMatches[0];
    console.log('Found language match:', selectedVoice.name);
    return selectedVoice;
  }

  // Ultimate fallback - avoid child voices
  const nonChildVoices = voices.filter(voice => {
    const voiceName = voice.name.toLowerCase();
    const childVoiceNames = ['maisie', 'child', 'kids', 'young'];
    return !childVoiceNames.some(childName => voiceName.includes(childName));
  });

  const finalVoice = nonChildVoices[0] || voices[0];
  console.log('Using fallback voice:', finalVoice?.name || 'none');
  return finalVoice || null;
};
