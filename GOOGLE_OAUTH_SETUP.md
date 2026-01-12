# Google OAuth Setup Guide for Word Pilot

This guide will walk you through setting up Google OAuth authentication for Word Pilot. You'll need to configure settings in both Google Cloud Console and Supabase Dashboard.

## Prerequisites

- A Google account
- Access to your Supabase project dashboard
- Your Word Pilot application URL (e.g., `https://word-pilot.com` or `http://localhost:5173` for local development)

---

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (or Use Existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `Word Pilot` (or any name you prefer)
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** (or "Google Identity Services API")
3. Click on it and click **"Enable"**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - **User Type**: Choose **"External"** (unless you have a Google Workspace)
   - Click **"CREATE"**
   - **App name**: `Word Pilot`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Click **"SAVE AND CONTINUE"**
   - **Scopes**: Click **"ADD OR REMOVE SCOPES"**, select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"**, then **"SAVE AND CONTINUE"**
   - **Test users** (if in testing mode): 
     - **IMPORTANT**: Click **"+ ADD USERS"** and add the email address you'll use to test Google sign-in
     - Add any other email addresses that need access during testing
     - **Note**: Only test users can sign in while the app is in testing mode
   - Click **"SAVE AND CONTINUE"**
   - Review and click **"BACK TO DASHBOARD"**

5. Now create the OAuth client:
   - **Application type**: Select **"Web application"**
   - **Name**: `Word Pilot Web Client`
   - **Authorized JavaScript origins**:
     - Add your production URL: `https://word-pilot.com` (or your actual domain)
     - Add your local development URL: `http://localhost:3000` (or your Vite dev port)
     - Add your Supabase project URL: `https://YOUR_PROJECT_ID.supabase.co`
   - **Authorized redirect URIs**:
     - Add: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
     - Replace `YOUR_PROJECT_ID` with your actual Supabase project ID
   - Click **"CREATE"**

6. **IMPORTANT**: Copy the following credentials (you'll need them for Supabase):
   - **Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Client Secret** (click "Show" to reveal it)

---

## Step 2: Supabase Dashboard Setup

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your Word Pilot project
3. Go to **"Authentication"** → **"Providers"** in the left sidebar
4. Find **"Google"** in the list and click on it
5. Toggle **"Enable Google provider"** to ON

### 2.2 Add Google OAuth Credentials

1. In the Google provider settings, enter:
   - **Client ID (for OAuth)**: Paste the Client ID from Google Cloud Console
   - **Client Secret (for OAuth)**: Paste the Client Secret from Google Cloud Console
2. Click **"Save"**

### 2.3 Configure Redirect URL

1. In the Google provider settings, you'll see a **"Redirect URL"** field
2. This should automatically be set to: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
3. **Verify this matches** the redirect URI you added in Google Cloud Console
4. If it doesn't match, update the redirect URI in Google Cloud Console to match this one

### 2.4 (Optional) Configure Site URL

1. Go to **"Authentication"** → **"URL Configuration"**
2. Set **"Site URL"** to your production URL: `https://word-pilot.com` (or your actual domain)
3. Add **"Redirect URLs"**:
   - `https://word-pilot.com/**` (for production)
   - `http://localhost:3000/**` (for local development)

---

## Step 3: Verify Setup

### 3.1 Test the Integration

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click **"Continue with Google"**
4. You should be redirected to Google's login page
5. After signing in with Google, you should be redirected back to your app
6. You should be logged in and see the home page

### 3.2 Troubleshooting

**Issue: "redirect_uri_mismatch" or "Access blocked" (even with published app)**
- **This is the #1 cause of OAuth errors!**
- **Solution**: 
  1. Go to Supabase Dashboard → Authentication → Providers → Google
  2. Look for "Redirect URL" - copy this EXACT URL (it shows the full redirect URL)
  3. Go to Google Cloud Console → Credentials → Your OAuth client
  4. Under "Authorized redirect URIs", make sure this EXACT URL is listed
  5. Common mistakes to avoid:
     - ❌ Trailing slash: `/auth/v1/callback/` (wrong)
     - ✅ No trailing slash: `/auth/v1/callback` (correct)
     - ❌ Wrong project ID
     - ❌ Using `http://` instead of `https://`
  6. Copy-paste the URL from Supabase (don't type it)
  7. Click "SAVE" in Google Cloud Console
  8. See `GOOGLE_OAUTH_DEBUG.md` for detailed troubleshooting

**Issue: "Access blocked: This app's request is invalid"**
- **This is the most common error!** It usually means:
  - Your OAuth consent screen is in **"Testing"** mode and your email isn't added as a test user
  - **Solution**: 
    1. Go to Google Cloud Console → **"APIs & Services"** → **"OAuth consent screen"**
    2. Scroll down to **"Test users"** section
    3. Click **"+ ADD USERS"**
    4. Add the email address you're trying to sign in with
    5. Click **"ADD"**
    6. Try signing in again
  - **Alternative**: If you want anyone to be able to sign in, you can publish the app (see Step 4.3)

**Issue: "Error 400: invalid_request"**
- **Solution**: Check that:
  - Google+ API is enabled in Google Cloud Console
  - OAuth consent screen is configured
  - Client ID and Secret are correctly entered in Supabase
  - Redirect URI exactly matches: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

**Issue: User not created after Google login**
- **Solution**: Check Supabase **"Authentication"** → **"Policies"** to ensure RLS policies allow Google-authenticated users

**Issue: Redirects to wrong URL after login**
- **Solution**: Update the `redirectTo` in `AuthContext.tsx` to match your site URL, or configure it in Supabase Dashboard under **"Authentication"** → **"URL Configuration"**

---

## Step 4: Production Deployment

### 4.1 Update Google Cloud Console

1. Go back to Google Cloud Console → **"Credentials"**
2. Edit your OAuth client
3. Add your production domain to **"Authorized JavaScript origins"**:
   - `https://word-pilot.com` (or your actual domain)
4. The redirect URI should already be correct (Supabase handles the callback)

### 4.2 Update Supabase

1. In Supabase Dashboard → **"Authentication"** → **"URL Configuration"**
2. Set **"Site URL"** to your production URL
3. Add your production URL to **"Redirect URLs"**

### 4.3 Publish OAuth Consent Screen (if in testing)

1. In Google Cloud Console → **"APIs & Services"** → **"OAuth consent screen"**
2. If your app is in "Testing" mode, you'll need to:
   - Add all test users who need access
   - Or click **"PUBLISH APP"** to make it available to all users
   - Note: Publishing requires verification if you request sensitive scopes

---

## Security Notes

1. **Never commit** your Google Client Secret to version control
2. The Client Secret is stored securely in Supabase and never exposed to the frontend
3. All OAuth flows happen through Supabase's secure backend
4. Users authenticated via Google have the same access as email/password users (same `user_id` in your database)

---

## How It Works

1. User clicks **"Continue with Google"** button
2. App calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. User is redirected to Google's login page
4. User authenticates with Google
5. Google redirects back to Supabase callback URL with authorization code
6. Supabase exchanges the code for user info and creates/updates the user
7. Supabase redirects back to your app (the `redirectTo` URL)
8. Your app's `AuthContext` detects the new session and updates the user state
9. User is automatically redirected to the home page

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase Dashboard → **"Authentication"** → **"Logs"** for auth events
3. Verify all URLs match exactly (no trailing slashes, correct protocol)
4. Ensure your Google OAuth consent screen is published (if not in testing mode)
