# OpenAI TTS 500 Error Investigation - Task Plan

## Problem Analysis
The OpenAI TTS Edge Function is returning 500 server errors, causing the frontend to fall back to robotic Web Speech API instead of the high-quality Ash voice. The issue appears to be server-side in the Supabase Edge Function.

**Current Understanding:**
- Frontend TTS integration is working correctly
- Edge Function `/supabase/functions/generate-speech/index.ts` exists and has comprehensive error handling
- Function attempts multiple OpenAI.fm endpoints with fallback to standard OpenAI API
- 500 errors suggest server-side configuration or deployment issues

## Investigation Tasks

### Phase 1: Diagnostic Information Gathering
- [ ] **Check Supabase Edge Function Deployment Status**
  - Verify function is properly deployed and active
  - Check deployment timestamp and version
  - Confirm function configuration

- [ ] **Examine Edge Function Real-time Logs**
  - Review live logs for specific 500 error details
  - Look for environment variable issues
  - Check for OpenAI API failures or timeouts

- [ ] **Verify Environment Variables and Secrets**
  - Check required environment variables are set
  - Verify `OPENAI_FM_API_KEY` is properly configured
  - Confirm database connection variables are correct

### Phase 2: Root Cause Analysis
- [ ] **Test OpenAI API Key Validity**
  - Verify API key has proper permissions for TTS
  - Check OpenAI account billing status and usage limits
  - Test API key directly with curl/external tool

- [ ] **Analyze Database Dependencies**
  - Check if `profiles` table exists and has proper structure
  - Verify `tts_requests` table exists for logging
  - Test database connectivity from Edge Function

- [ ] **Test Edge Function Directly**
  - Send test request to Edge Function endpoint
  - Isolate frontend vs backend issues
  - Verify request/response format compatibility

### Phase 3: Fix Implementation
- [ ] **Address Identified Issues**
  - Fix environment variable configuration if needed
  - Redeploy Edge Function with proper secrets
  - Update database schema if required

- [ ] **Verify Fix Effectiveness**
  - Test TTS functionality from frontend
  - Confirm Ash voice plays without fallback
  - Verify 200 status codes in network requests

- [ ] **Update Documentation**
  - Document root cause and solution in CLAUDE.md
  - Add troubleshooting steps for future reference
  - Update configuration notes

## Expected Outcomes

**Success Criteria:**
- ✅ Edge Function returns 200 status codes
- ✅ High-quality Ash voice plays in frontend
- ✅ No fallback to Web Speech API
- ✅ Console shows successful TTS generation

**Most Likely Root Causes:**
1. **Environment Variable Issue**: Missing or incorrect `OPENAI_FM_API_KEY`
2. **Deployment Problem**: Edge Function not properly deployed
3. **Database Issue**: Missing required tables or connection problems
4. **OpenAI Account**: Billing or usage limits reached

## Security Considerations
- Verify API keys are properly secured in environment
- Ensure no sensitive data is logged in Edge Function
- Confirm proper CORS configuration for production

## Simplicity Guidelines
- Focus only on the 500 error - don't modify working frontend code
- Make minimal changes to fix the specific issue
- Test each change individually before proceeding
- Preserve all existing functionality and error handling

---

## Review Section

### Investigation Results
**Root Cause Found**: The Edge Function environment variable `OPENAI_FM_API_KEY` is not configured in the Supabase project settings. The current Edge Function code expects this key but receives "undefined", causing OpenAI API calls to fail with "Incorrect API key provided: undefined".

**Current Status**: 
- ✅ Edge Function is deployed and responding (not deployment issue)
- ✅ Edge Function accepts requests with proper authentication 
- ❌ Returns 500 error due to missing `OPENAI_FM_API_KEY` environment variable
- ❌ Frontend still falls back to Web Speech API instead of high-quality OpenAI TTS

### Changes Made
- **None yet** - Investigation only session
- Identified exact error through direct curl testing of Edge Function
- Found API key exists locally (`tts-13112b71a1769fdcc923541180b7cca6`) but not in Supabase environment

### Root Cause Found
The 500 error is caused by missing `OPENAI_FM_API_KEY` environment variable in the Supabase Edge Function environment. The current code checks for this key and returns "TTS service not configured" if not found, but it reaches the OpenAI API call where it fails with "undefined" API key.

### Future Prevention
1. **Environment Variable Documentation**: Maintain clear documentation of required environment variables for Edge Functions
2. **Deployment Checklist**: Include environment variable verification in deployment process
3. **Error Handling**: Improve error messages to clearly indicate missing environment variables
4. **Local vs Remote Sync**: Establish process to sync environment variables between local and Supabase environments

### Next Steps for Fresh Session
1. **Set Environment Variable**: Add `OPENAI_FM_API_KEY=tts-13112b71a1769fdcc923541180b7cca6` to Supabase project settings
2. **Test Ash Voice**: Verify premium voice functionality works with proper API key
3. **Simplify if Needed**: Consider using standard OpenAI API if openai.fm causes issues
4. **Full Verification**: Complete end-to-end TTS testing once environment is properly configured