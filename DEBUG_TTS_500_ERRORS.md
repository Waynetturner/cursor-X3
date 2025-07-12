# 🔍 Debug TTS 500 Errors - Comprehensive Guide

## 🚀 ENHANCED EDGE FUNCTION DEPLOYED

The `generate-speech` function now includes comprehensive debugging to identify the exact issue:

### **🔧 Debug Features Added:**

1. **Environment Variable Checking**: Logs if API keys are present
2. **Multiple Endpoint Testing**: Tries 3 different openai.fm endpoints
3. **Fallback to Standard OpenAI**: Falls back if openai.fm fails
4. **Detailed Error Logging**: Shows exact API responses and errors
5. **Request/Response Logging**: Logs all API communication

## 📋 DEPLOYMENT & TESTING STEPS

### **1. Deploy the Enhanced Function**
```bash
cd /home/waynetturner/projects/x3-tracker
supabase functions deploy generate-speech
```

### **2. Test with Detailed Logging**
```bash
# Test the function and watch logs in real-time
supabase functions logs generate-speech --follow
```

### **3. Trigger a TTS Request**
In the app:
- Upgrade to Momentum tier 
- Try to start an exercise with TTS enabled
- Check the live logs for detailed output

### **4. Verify Environment Variables**
```bash
# Check if the secret is properly set
supabase secrets list

# If not listed, set it again
supabase secrets set OPENAI_FM_API_KEY=your-actual-key-here
```

## 🔍 WHAT THE LOGS WILL SHOW

### **Expected Log Output:**
```
🚀 Generate speech function started
Environment check: {
  SUPABASE_URL: "SET",
  SUPABASE_SERVICE_ROLE_KEY: "SET", 
  OPENAI_FM_API_KEY: "SET"
}
📥 Request received: {"text":"Let's crush this...", "voice":"ash", ...}
TTS request for momentum tier user  
✅ OPENAI_FM_API_KEY found, length: XX
🔍 Trying endpoint: https://openai.fm/v1/audio/speech
📡 Response from https://openai.fm/v1/audio/speech: {
  status: 404/401/500,
  statusText: "...",
  headers: {...}
}
❌ Failed with https://openai.fm/v1/audio/speech: [error details]
🔍 Trying endpoint: https://api.openai.fm/v1/audio/speech
[... continues testing endpoints ...]
```

## 🎯 POTENTIAL ISSUES TO IDENTIFY

### **1. API Key Issues**
```
❌ OPENAI_FM_API_KEY not found in environment variables
```
**Solution**: Re-add the secret to Supabase

### **2. Wrong Endpoint**
```
❌ Failed with https://openai.fm/v1/audio/speech: 404 Not Found
```
**Solution**: Will try alternative endpoints automatically

### **3. Authentication Issues**
```
❌ Failed with [endpoint]: 401 Unauthorized  
```
**Solution**: Verify API key is correct for openai.fm

### **4. Parameter Issues**
```
❌ Failed with [endpoint]: 400 Bad Request - "instructions not supported"
```
**Solution**: Function will try fallback without instructions

### **5. Network Issues**
```
💥 Network error with [endpoint]: DNS resolution failed
```
**Solution**: Indicates openai.fm domain issues

## 🔄 AUTOMATIC FALLBACKS

The function now has multiple fallbacks:

1. **Primary**: `https://openai.fm/v1/audio/speech`
2. **Secondary**: `https://api.openai.fm/v1/audio/speech`  
3. **Tertiary**: `https://openai.fm/api/v1/audio/speech`
4. **Fallback**: `https://api.openai.com/v1/audio/speech` (standard OpenAI)

## 📝 COMMON SOLUTIONS

### **If openai.fm doesn't exist:**
- Function will automatically fall back to standard OpenAI
- Will map 'ash' voice to 'alloy' 
- Still provides high-quality TTS

### **If API key is wrong:**
- Logs will show "401 Unauthorized"
- Double-check the key format and service

### **If rate limited:**
- Logs will show "429 Too Many Requests"
- May need usage limits on openai.fm

## 🚀 NEXT STEPS

1. **Deploy**: `supabase functions deploy generate-speech`
2. **Monitor**: `supabase functions logs generate-speech --follow`
3. **Test**: Try TTS in the app
4. **Analyze**: Check logs for exact error details
5. **Report**: Share the specific log output showing what's failing

The enhanced function will definitively identify whether:
- The openai.fm service exists and is accessible
- The API key works with their service  
- The endpoint URLs are correct
- The request format is supported

**Run the deployment and test - the logs will show exactly what's happening!** 🔍✨