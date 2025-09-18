# Google Consent Revocation Implementation

This document demonstrates how to use the Google OAuth consent revocation functionality that has been implemented in your Soleva project.

## Overview

The implementation includes:
1. **Frontend utility** for revoking Google consent using Google Identity Services API
2. **Backend endpoint** for disconnecting Google accounts from user profiles
3. **Automatic integration** with the logout flow
4. **Test component** for demonstrating the functionality

## Code Example

Here's the exact code you provided, now properly integrated:

```javascript
google.accounts.id.revoke('user@google.com', done => {
  console.log('consent revoked');
});
```

## Implementation Details

### 1. Frontend Utility (`src/utils/googleConsent.ts`)

```typescript
import { revokeGoogleConsent } from '../utils/googleConsent';

// Revoke consent for a specific email
await revokeGoogleConsent(
  'user@google.com',
  () => console.log('Consent revoked successfully'),
  (error) => console.error('Failed to revoke consent:', error)
);
```

### 2. React Hook (`src/components/SocialLogin.tsx`)

```typescript
import { useGoogleConsentRevocation } from '../hooks/useGoogleConsentRevocation';

const MyComponent = () => {
  const { revokeGoogleConsent } = useGoogleConsentRevocation();
  
  const handleRevoke = async () => {
    await revokeGoogleConsent('user@google.com');
  };
  
  return <button onClick={handleRevoke}>Revoke Google Consent</button>;
};
```

### 3. Backend API Endpoint

**Endpoint:** `POST /api/v1/auth/customer/disconnect-google`

**Request:** Requires authentication token in header
```json
{
  "Authorization": "Bearer <your-jwt-token>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google account disconnected successfully"
}
```

### 4. Automatic Logout Integration

The logout function in `AuthContext` now automatically revokes Google consent:

```typescript
const { logout } = useAuth();

// This will automatically revoke Google consent if the user has a Google account
await logout();
```

## Usage Examples

### Example 1: Manual Consent Revocation

```typescript
import { useGoogleConsentRevocation } from '../hooks/useGoogleConsentRevocation';
import { authApi } from '../services/api';

const RevokeConsentButton = () => {
  const { revokeGoogleConsent } = useGoogleConsentRevocation();
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    setLoading(true);
    try {
      // Revoke Google consent
      await revokeGoogleConsent('user@google.com');
      
      // Disconnect from backend
      await authApi.disconnectGoogle();
      
      console.log('Google consent revoked and account disconnected');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleRevoke} disabled={loading}>
      {loading ? 'Revoking...' : 'Revoke Google Consent'}
    </button>
  );
};
```

### Example 2: Logout with Automatic Revocation

```typescript
import { useAuth } from '../contexts/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    // This automatically revokes Google consent if applicable
    await logout();
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

### Example 3: Test Component

Use the provided test component to verify functionality:

```typescript
import GoogleConsentTest from '../components/GoogleConsentTest';

const TestPage = () => {
  return (
    <div>
      <h1>Google Consent Revocation Test</h1>
      <GoogleConsentTest />
    </div>
  );
};
```

## API Reference

### Frontend Functions

#### `revokeGoogleConsent(email, onSuccess?, onError?)`
- **email**: string - The email address to revoke consent for
- **onSuccess**: () => void - Optional success callback
- **onError**: (error: Error) => void - Optional error callback

#### `useGoogleConsentRevocation()`
Returns an object with:
- **revokeGoogleConsent**: Function to revoke Google consent

### Backend Endpoints

#### `POST /api/v1/auth/customer/disconnect-google`
- **Authentication**: Required (Bearer token)
- **Response**: Success/error message
- **Effect**: Removes Google ID from user account

## Error Handling

The implementation includes comprehensive error handling:

1. **Google Client ID not configured**: Graceful fallback
2. **Network errors**: User-friendly error messages
3. **Backend errors**: Detailed error responses
4. **Script loading failures**: Automatic retry logic

## Security Considerations

1. **Client-side revocation**: Uses Google's official API
2. **Backend validation**: Verifies user authentication
3. **Token blacklisting**: Secure logout implementation
4. **Error logging**: Comprehensive error tracking

## Testing

To test the implementation:

1. **Login with Google** to your application
2. **Use the test component** to verify revocation
3. **Check browser console** for success/error messages
4. **Verify backend** that Google ID is removed from user profile

## Browser Compatibility

The implementation works with:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- Google Identity Services API
- React 18+
- TypeScript 4.5+

## Environment Variables

Required environment variable:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Conclusion

The Google consent revocation functionality is now fully integrated into your Soleva project. Users can revoke their Google consent either manually or automatically during logout, providing better privacy control and compliance with data protection regulations.
