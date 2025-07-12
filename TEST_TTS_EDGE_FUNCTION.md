# 🔧 TTS Edge Function Debug Guide

## ✅ FIXES APPLIED

### **1. Fixed Invalid OpenAI Model**
- **Before**: `'gpt-4o-mini-tts'` (doesn't exist)
- **After**: `'tts-1-hd'` (valid high-definition model)

### **2. Removed Invalid Parameters**
- **Before**: `instructions` parameter (not supported)
- **After**: Only valid parameters: `model`, `input`, `voice`, `speed`, `response_format`

### **3. Fixed Voice Validation**
- **Before**: Using `'ash'` voice (doesn't exist in OpenAI TTS)
- **After**: Valid voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- **Default**: Changed from `'ash'` to `'nova'` (high-quality female voice)

### **4. Enhanced Error Logging**
- Added detailed error response parsing
- Added request body logging for debugging
- Added voice validation with fallback

## 🧪 TESTING STEPS

### **1. Deploy Updated Edge Function**
```bash
# Deploy the fixed function
supabase functions deploy generate-speech
```

### **2. Test Direct API Call**
```bash
# Test the endpoint directly
curl -X POST 'https://[your-supabase-url]/functions/v1/generate-speech' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Hello, this is a test",
    "voice": "nova",
    "speed": 1.0,
    "user_id": "[test-user-id]",
    "context": "general"
  }'
```

### **3. Check Edge Function Logs**
```bash
# View function logs for debugging
supabase functions logs generate-speech
```

### **4. Verify Environment Variables**
Ensure these are set in Supabase Edge Function secrets:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key

```bash
# Set secrets if missing
supabase secrets set OPENAI_API_KEY=sk-...
```

## 🔍 DEBUGGING CHECKLIST

### **Common Issues:**

1. **Environment Variables Missing**
   - Check: `OPENAI_API_KEY` is set and valid
   - Check: Supabase environment variables are correct

2. **User Profile Not Found**
   - Ensure user exists in `profiles` table
   - Check user authentication is working

3. **OpenAI API Issues**
   - Verify API key has TTS permissions
   - Check OpenAI account has sufficient credits
   - Ensure rate limits aren't exceeded

4. **Network/CORS Issues**
   - Check CORS headers are properly set
   - Verify Supabase URL is accessible

### **Log Analysis:**
Look for these log entries:
- `🎤 TTS Request - Context: ...` (Request received)
- `📤 OpenAI TTS Request: ...` (API call details)
- `⚠️ Voice 'ash' not supported, using 'alloy' instead` (Voice fallback)
- Any error messages with HTTP status codes

## 📝 EXPECTED BEHAVIOR

### **Success Flow:**
```
1. Client calls generateSpeech() with 'nova' voice
2. Edge Function validates voice (nova is valid)
3. Makes OpenAI TTS API call with tts-1-hd model
4. Receives MP3 audio data
5. Converts to base64 data URL
6. Returns audio_url to client
7. Client plays high-quality TTS audio
```

### **Error Flow:**
```
1. Client calls generateSpeech() with 'ash' voice  
2. Edge Function detects invalid voice, falls back to 'alloy'
3. OpenAI API call succeeds with fallback voice
4. Returns audio with warning in logs
```

## 🎯 NEXT STEPS

1. **Deploy the fixed Edge Function**
2. **Run the TTS_VOICE_UPDATE.sql migration** to fix existing user settings
3. **Test with a Momentum/Mastery user** in the app
4. **Check Edge Function logs** for any remaining issues
5. **Verify OpenAI TTS works** with Nova voice

The primary issues were:
- Invalid OpenAI model name
- Unsupported 'ash' voice  
- Invalid API parameters

These fixes should resolve the 500 errors and enable premium TTS! 🚀