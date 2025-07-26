# 🚀 Deploy TTS Edge Function - Fix 500 Errors

## 🚨 PROBLEM IDENTIFIED

The `generate-speech` Edge Function **exists in code but is NOT deployed** to Supabase. The app tries to call:
```
POST /functions/v1/generate-speech
```
But gets **404/500 errors** because the function doesn't exist on the server.

## ✅ SOLUTION: Deploy the Edge Function

### **1. Deploy the Fixed TTS Function**
```bash
# Navigate to project root
cd /home/waynetturner/projects/x3-tracker

# Deploy the generate-speech function 
supabase functions deploy generate-speech

# Verify deployment
supabase functions list
```

### **2. Set Required Environment Variables**
The function needs these secrets in Supabase:
```bash
# Set OpenAI API key (required for TTS)
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key-here

# Verify secrets are set
supabase secrets list
```

### **3. Test the Deployed Function**
```bash
# Test direct API call
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-speech' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Hello, this is a test of OpenAI TTS",
    "voice": "nova", 
    "speed": 1.0,
    "user_id": "test-user-id",
    "context": "general"
  }'
```

### **4. Check Function Logs**
```bash
# Monitor function logs for debugging
supabase functions logs generate-speech --follow
```

## 🔧 WHAT THE FUNCTION DOES

The `generate-speech` Edge Function:
1. ✅ Validates user subscription tier  
2. ✅ Calls OpenAI TTS API with `tts-1-hd` model
3. ✅ Uses valid voices: `nova`, `alloy`, `echo`, `fable`, `onyx`, `shimmer`
4. ✅ Returns base64 audio data URL
5. ✅ Logs TTS requests for analytics

## 📝 EXPECTED RESULTS

### **Before Deployment (Current):**
```
❌ POST /functions/v1/generate-speech → 404/500
❌ Error: "Speech generation error: 500" 
❌ Falls back to Web Speech API
❌ No premium OpenAI TTS voices
```

### **After Deployment:**
```
✅ POST /functions/v1/generate-speech → 200
✅ Returns: {"success": true, "audio_url": "data:audio/mpeg;base64,..."}
✅ High-quality Nova/Alloy TTS plays
✅ 🤖 OpenAI TTS indicator shows in UI
✅ Premium voices for Momentum/Mastery users
```

## 🎯 VERIFICATION STEPS

1. **Deploy Function**: `supabase functions deploy generate-speech`
2. **Set API Key**: `supabase secrets set OPENAI_API_KEY=sk-...`
3. **Test in App**: Upgrade to Momentum tier and try TTS
4. **Check Logs**: Monitor for successful OpenAI API calls
5. **Verify Audio**: Confirm high-quality voice playback

## ⚠️ TROUBLESHOOTING

If deployment fails:
- Check Supabase CLI is installed and authenticated
- Verify project is linked: `supabase status`
- Check function syntax: `deno check supabase/functions/generate-speech/index.ts`

If function still errors:
- Verify OpenAI API key has TTS permissions
- Check OpenAI account has sufficient credits  
- Monitor Edge Function logs for detailed errors

## 🚀 DEPLOY NOW

Run this single command to fix the TTS 500 errors:
```bash
supabase functions deploy generate-speech
```

The function code is **already fixed** with valid OpenAI TTS parameters - it just needs to be deployed! 🎤✨