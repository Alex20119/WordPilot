# Quick Fix: "Access blocked: This app's request is invalid"

## The Problem
You're seeing this error when trying to sign in with Google:
```
Access blocked: This app's request is invalid
```

## The Solution (90% of cases)

This error happens because your OAuth consent screen is in **"Testing"** mode and your email isn't added as a test user.

### Fix Steps:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (Word Pilot)

2. **Open OAuth Consent Screen**
   - Click **"APIs & Services"** in the left menu
   - Click **"OAuth consent screen"**

3. **Add Your Email as Test User**
   - Scroll down to the **"Test users"** section
   - Click **"+ ADD USERS"** button
   - Enter the email address you're trying to sign in with
   - Click **"ADD"**
   - You should see your email appear in the test users list

4. **Try Again**
   - Go back to your Word Pilot login page
   - Click **"Continue with Google"**
   - You should now be able to sign in!

## Alternative: Publish Your App (for production)

If you want anyone to be able to sign in (not just test users):

1. In the OAuth consent screen, click **"PUBLISH APP"** button at the top
2. Confirm the publishing
3. **Note**: Publishing may require verification if you request sensitive scopes

## Still Not Working?

### Check These Common Issues:

1. **Redirect URI Mismatch**
   - In Google Cloud Console → **"Credentials"** → Edit your OAuth client
   - Check **"Authorized redirect URIs"**
   - Must exactly match: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Replace `YOUR_PROJECT_ID` with your actual Supabase project ID
   - No trailing slashes, exact match required

2. **Wrong Client ID/Secret in Supabase**
   - Go to Supabase Dashboard → **"Authentication"** → **"Providers"** → **"Google"**
   - Verify the Client ID and Client Secret match what's in Google Cloud Console
   - Make sure there are no extra spaces or characters

3. **OAuth Consent Screen Not Configured**
   - Make sure you completed the OAuth consent screen setup
   - Required fields: App name, User support email, Developer contact

4. **API Not Enabled**
   - In Google Cloud Console → **"APIs & Services"** → **"Library"**
   - Search for "Google+ API" or "Google Identity Services API"
   - Make sure it's enabled (should show "Enabled" status)

## Need More Help?

Check the full setup guide: `GOOGLE_OAUTH_SETUP.md`
