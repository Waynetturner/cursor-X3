
export const logAllAvailableVoices = () => {
  const voices = window.speechSynthesis.getVoices();
  console.log('=== ALL AVAILABLE VOICES ===');
  voices.forEach((voice, index) => {
    console.log(`${index}: ${voice.name} | Language: ${voice.lang} | Default: ${voice.default} | Local: ${voice.localService}`);
  });
  console.log('=== END OF VOICE LIST ===');
  
  // Group by language for easier reading
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  console.log('=== ENGLISH VOICES ONLY ===');
  englishVoices.forEach((voice, index) => {
    const gender = voice.name.toLowerCase().includes('female') || 
                  voice.name.toLowerCase().includes('woman') || 
                  voice.name.toLowerCase().includes('zira') || 
                  voice.name.toLowerCase().includes('eva') || 
                  voice.name.toLowerCase().includes('susan') || 
                  voice.name.toLowerCase().includes('hazel') ||
                  voice.name.toLowerCase().includes('libby') ||
                  voice.name.toLowerCase().includes('samantha') || 
                  voice.name.toLowerCase().includes('victoria') ||
                  voice.name.toLowerCase().includes('karen') || 
                  voice.name.toLowerCase().includes('kate') ||
                  voice.name.toLowerCase().includes('serena') ? 'FEMALE' : 'MALE';
    
    const accent = voice.lang.includes('GB') || voice.lang.includes('UK') ? 'BRITISH' : 'AMERICAN';
    
    console.log(`${index}: "${voice.name}" | ${voice.lang} | ${gender} | ${accent}`);
  });
  console.log('=== END OF ENGLISH VOICES ===');
};
