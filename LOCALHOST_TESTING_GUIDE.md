# Localhost Testing Guide - Google/Facebook Login & Error Messages

This guide provides step-by-step instructions for testing the authentication system on localhost.

## 🚀 Quick Start

### 1. Start Local Development Environment
```bash
# From project root
./start-local.sh
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API server (port 5000)
- Frontend development server (port 3000)
- Admin panel (port 3001)

### 2. Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Admin Panel**: http://localhost:3001
- **API Documentation**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/health

## 🔐 OAuth Configuration

### Google OAuth Setup
1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select project
   - Enable Google+ API
   - Go to "APIs & Services" > "OAuth consent screen"
   - Configure consent screen (External user type)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users

2. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URIs:
     ```
     http://localhost:3000
     http://localhost:3000/auth/callback/google
     ```

3. **Update Environment**:
   ```env
   # Frontend (.env.local)
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   
   # Backend (.env)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### Facebook OAuth Setup
1. **Facebook Developer Console**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create new app (Consumer type)
   - Add "Facebook Login" product

2. **Configure Facebook Login**:
   - Go to "Facebook Login" > "Settings"
   - Add valid OAuth redirect URIs:
     ```
     http://localhost:3000
     http://localhost:3000/auth/callback/facebook
     ```

3. **Update Environment**:
   ```env
   # Frontend (.env.local)
   VITE_FACEBOOK_APP_ID=your-facebook-app-id
   
   # Backend (.env)
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   ```

## 🧪 Testing Authentication Flows

### 1. Email/Password Login
**Test URL**: http://localhost:3000/login

**Test Cases**:
- ✅ Valid credentials
- ❌ Invalid email format
- ❌ Wrong password
- ❌ Non-existent user
- ❌ Empty fields

**Expected Behavior**:
- Success: Redirect to `/account` with success toast
- Error: Show specific error message from backend

### 2. Google OAuth Login
**Test URL**: http://localhost:3000/login

**Test Flow**:
1. Click "Google" button
2. Google OAuth consent screen appears
3. Select test user account
4. Grant permissions
5. Redirect back to app
6. User logged in successfully

**Expected Behavior**:
- Success: User logged in, redirected to `/account`
- Error: Show specific error message (e.g., "Invalid Google token")

### 3. Facebook OAuth Login
**Test URL**: http://localhost:3000/login

**Test Flow**:
1. Click "Facebook" button
2. Facebook login popup appears
3. Enter credentials or use test user
4. Grant permissions
5. Popup closes, user logged in

**Expected Behavior**:
- Success: User logged in, redirected to `/account`
- Error: Show specific error message (e.g., "Email not provided by Facebook")

### 4. Registration Flow
**Test URL**: http://localhost:3000/register

**Test Cases**:
- ✅ Valid registration data
- ❌ Email already exists
- ❌ Password mismatch
- ❌ Weak password
- ❌ Invalid email format

## 🔍 Error Message Testing

### Backend Error Messages
The backend returns specific error messages for different scenarios:

```json
// Invalid credentials
{
  "success": false,
  "message": "Invalid credentials"
}

// Account disabled
{
  "success": false,
  "message": "Account is disabled"
}

// Email not provided by OAuth
{
  "success": false,
  "message": "Email not provided by Google"
}

// Invalid OAuth token
{
  "success": false,
  "message": "Invalid Google token"
}
```

### Frontend Error Display
The frontend now properly displays backend error messages:

1. **Login Page**: Shows error in toast notification
2. **Registration Page**: Shows error in toast notification
3. **Social Login**: Shows provider-specific error messages

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   ```
   Solution: Ensure OAuth provider settings match exactly:
   - http://localhost:3000
   - http://localhost:3000/auth/callback/google
   - http://localhost:3000/auth/callback/facebook
   ```

2. **"App not verified" (Google)**
   ```
   Solution: This is normal for development. Click "Advanced" > "Go to [App Name] (unsafe)"
   ```

3. **CORS Errors**
   ```
   Solution: Check backend .env file:
   CORS_ORIGIN=http://localhost:3000
   ```

4. **"Client ID not found"**
   ```
   Solution: 
   1. Verify environment variables are set
   2. Restart development servers
   3. Check .env files are in correct locations
   ```

5. **Database Connection Issues**
   ```
   Solution: Ensure PostgreSQL is running:
   docker-compose -f docker-compose.local.yml up -d postgres
   ```

### Debug Steps

1. **Check Backend Logs**:
   ```bash
   cd backend
   npm run dev
   # Watch console for authentication errors
   ```

2. **Check Frontend Console**:
   - Open browser DevTools
   - Check Console tab for JavaScript errors
   - Check Network tab for failed API calls

3. **Test API Endpoints Directly**:
   ```bash
   # Test login endpoint
   curl -X POST http://localhost:5000/api/v1/auth/customer/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   
   # Test health endpoint
   curl http://localhost:5000/health
   ```

4. **Verify Environment Variables**:
   ```bash
   # Check if variables are loaded
   echo $VITE_GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_ID
   ```

## 📋 Testing Checklist

### Pre-Testing Setup
- [ ] OAuth providers configured with localhost URLs
- [ ] Environment variables set correctly
- [ ] Development servers running
- [ ] Database seeded with test data

### Authentication Testing
- [ ] Email/password login works
- [ ] Email/password login shows correct error messages
- [ ] Google OAuth login works
- [ ] Google OAuth shows correct error messages
- [ ] Facebook OAuth login works
- [ ] Facebook OAuth shows correct error messages
- [ ] Registration works
- [ ] Registration shows correct error messages
- [ ] User session persists after login
- [ ] Logout works correctly

### Error Message Testing
- [ ] Invalid credentials show "Invalid credentials"
- [ ] Disabled account shows "Account is disabled"
- [ ] OAuth errors show provider-specific messages
- [ ] Network errors show "Login failed. Please try again."
- [ ] All error messages are user-friendly
- [ ] Error messages support both English and Arabic

## 🎯 Success Criteria

✅ **OAuth Flow Complete**: Click login → OAuth consent → redirect back → login success

✅ **Real Error Messages**: All error messages come from backend responses, no hardcoded messages

✅ **Backend Integration**: All login methods connected to backend authentication system

✅ **Session Persistence**: User session works correctly and persists as expected

✅ **Localhost URLs**: All testing works on http://localhost:3000 and http://localhost:5000

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the OAuth setup guide: `OAUTH_LOCALHOST_SETUP.md`
3. Check backend logs for detailed error information
4. Verify all environment variables are set correctly
