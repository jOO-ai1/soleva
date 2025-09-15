# OAuth Localhost Testing Setup Guide

This guide will help you set up Google and Facebook OAuth for localhost testing.

## Prerequisites

1. **Google Cloud Console Setup**
2. **Facebook Developer Console Setup**
3. **Environment Configuration**

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "Soleva Store (Development)"
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (your email addresses)

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback/google
   http://localhost:5173
   http://localhost:5173/auth/callback/google
   ```
5. Copy the Client ID and Client Secret

## 2. Facebook OAuth Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" app type
4. Fill in app details:
   - App name: "Soleva Store (Development)"
   - App contact email: your email

### Step 2: Configure Facebook Login
1. Add "Facebook Login" product
2. Go to "Facebook Login" > "Settings"
3. Add valid OAuth redirect URIs:
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback/facebook
   http://localhost:5173
   http://localhost:5173/auth/callback/facebook
   ```
4. Copy the App ID and App Secret

### Step 3: Configure App Settings
1. Go to "Settings" > "Basic"
2. Add App Domains: `localhost`
3. Add Website URL: `http://localhost:3000`

## 3. Environment Configuration

### Frontend Environment (.env.local)
Create or update `.env.local` in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Facebook OAuth
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

### Backend Environment (.env)
Create or update `.env` in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only-minimum-32-characters
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL="postgresql://soleva:soleva123@localhost:5432/soleva_dev?schema=public"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## 4. Testing URLs

### Local Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Admin Panel**: http://localhost:3001

### OAuth Callback URLs
- **Google**: http://localhost:3000/auth/callback/google
- **Facebook**: http://localhost:3000/auth/callback/facebook

## 5. Testing the OAuth Flow

### Test Google Login
1. Start the development servers
2. Navigate to http://localhost:3000/login
3. Click "Google" login button
4. Complete OAuth flow
5. Verify user is logged in and redirected

### Test Facebook Login
1. Start the development servers
2. Navigate to http://localhost:3000/login
3. Click "Facebook" login button
4. Complete OAuth flow
5. Verify user is logged in and redirected

## 6. Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URIs are exactly as configured in OAuth providers
   - Check for trailing slashes and protocol (http vs https)

2. **"App not verified"**
   - This is normal for development
   - Add test users in OAuth consent screen
   - Use "Advanced" > "Go to [App Name] (unsafe)" when prompted

3. **CORS errors**
   - Ensure CORS_ORIGIN in backend .env matches frontend URL
   - Check that backend is running on correct port

4. **"Client ID not found"**
   - Verify environment variables are set correctly
   - Restart development servers after changing .env files

### Debug Steps
1. Check browser console for errors
2. Check backend logs for authentication errors
3. Verify environment variables are loaded
4. Test API endpoints directly with Postman/curl

## 7. Production Considerations

When moving to production:
1. Update OAuth provider settings with production domains
2. Use production OAuth credentials
3. Update environment variables
4. Ensure HTTPS is enabled
5. Update CORS settings for production domains

## 8. Security Notes

- Never commit OAuth secrets to version control
- Use different credentials for development and production
- Regularly rotate OAuth secrets
- Monitor OAuth usage and implement rate limiting
- Use environment-specific OAuth apps when possible
