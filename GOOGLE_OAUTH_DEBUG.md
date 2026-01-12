# Debugging "Access blocked" Error (Published App)

If you've published your OAuth app but still get "Access blocked: This app's request is invalid", follow these steps:

## Step 1: Verify Redirect URI (MOST COMMON FIX)

The redirect URI in Google Cloud Console MUST exactly match what Supabase uses.

1. **Find Your Supabase Project ID:**
   - Go to Supabase Dashboard → Your project
   - Look at the URL: `https://app.supabase.com/project/YOUR_PROJECT_ID`
   - Or go to Settings → API → Your Project URL will be: `https://YOUR_PROJECT_ID.supabase.co`

2. **Check Google Cloud Console Redirect URI:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID
   - Check "Authorized redirect URIs"
   - Must have exactly: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - **Important**: 
     - No trailing slash
     - Must be `https://` (not `http://`)
     - Must match your Supabase project ID exactly
     - Case-sensitive

3. **Copy the exact redirect URI from Supabase:**
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Look for "Redirect URL" - it should show something like:
     `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Copy this EXACT URL (including the `/auth/v1/callback` part)

4. **Update Google Cloud Console:**
   - In your OAuth client settings
   - Under "Authorized redirect URIs"
   - Make sure this EXACT URL is listed (copy-paste it, don't type it)
   - Click "SAVE"

## Step 2: Verify Authorized JavaScript Origins

1. In Google Cloud Console → Credentials → Your OAuth client
2. Check "Authorized JavaScript origins"
3. Must include:
   - `https://YOUR_PROJECT_ID.supabase.co` (your Supabase URL)
   - `http://localhost:3000` (if testing locally)
   - Your production domain (if deployed)

## Step 3: Verify Client ID and Secret in Supabase

1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Copy the **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
4. Click "Show" next to Client Secret and copy it

5. Go to Supabase Dashboard → Authentication → Providers → Google
6. Verify:
   - **Client ID (for OAuth)**: Should exactly match what you copied
   - **Client Secret (for OAuth)**: Should exactly match what you copied
   - No extra spaces before/after
   - Toggle "Enable Google provider" is ON

7. If they don't match, update them and click "Save"

## Step 4: Clear Browser Cache

Sometimes browser cache causes issues:

1. Open an incognito/private window
2. Try the Google sign-in again
3. Or clear your browser cache and cookies for Google

## Step 5: Check Browser Console for Exact Error

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try the Google sign-in
4. Look for any error messages
5. Check the Network tab for failed requests
6. The error message might give more details

## Step 6: Verify OAuth Consent Screen Settings

Even though published, check these settings:

1. Google Cloud Console → APIs & Services → OAuth consent screen
2. Verify:
   - Publishing status shows "In production" (not "Testing")
   - App name is set
   - User support email is set
   - Scopes include: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`

## Step 7: Check Supabase Logs

1. Go to Supabase Dashboard → Authentication → Logs
2. Try the Google sign-in
3. Check the logs for any error messages
4. Look for authentication events - they might show what's failing

## Common Mistakes

❌ **WRONG**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback/` (trailing slash)
✅ **RIGHT**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

❌ **WRONG**: Using `http://` instead of `https://`
✅ **RIGHT**: Always use `https://` for Supabase redirects

❌ **WRONG**: Wrong project ID in redirect URI
✅ **RIGHT**: Use your exact Supabase project ID

❌ **WRONG**: Client ID/Secret has extra spaces
✅ **RIGHT**: Copy-paste exactly, no spaces

## Still Not Working?

If none of these work, try:

1. **Create a new OAuth client:**
   - In Google Cloud Console, delete the old OAuth client
   - Create a new one with the correct redirect URI from the start
   - Update Supabase with the new Client ID and Secret

2. **Check if there's a delay:**
   - Sometimes changes take a few minutes to propagate
   - Wait 5-10 minutes and try again

3. **Contact Support:**
   - Check Supabase logs for specific error codes
   - The error code might give more information about what's wrong
