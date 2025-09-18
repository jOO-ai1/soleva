/**
 * Google Consent Revocation Utility
 * Handles Google OAuth consent revocation using Google Identity Services API
 */

// Extend window interface for Google
declare global {
  interface Window {
    google: any;
  }
}

/**
 * Load Google Identity Services script
 */
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
};

/**
 * Revoke Google OAuth consent for a specific email
 * @param email - The email address to revoke consent for
 * @param onSuccess - Optional callback when revocation is successful
 * @param onError - Optional callback when revocation fails
 */
export const revokeGoogleConsent = async (
  email: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // Check if Google Client ID is configured
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new Error('Google Client ID not configured');
    }
    
    // Load Google Identity Services if not already loaded
    if (!window.google) {
      await loadGoogleScript();
    }

    // Revoke Google consent
    window.google.accounts.id.revoke(email, (done: any) => {
      console.log('Google consent revoked for:', email);
      onSuccess?.();
    });
  } catch (error) {
    console.error('Google consent revocation error:', error);
    onError?.(error instanceof Error ? error : new Error('Failed to revoke Google consent'));
  }
};

/**
 * Check if Google consent revocation is available
 */
export const isGoogleConsentRevocationAvailable = (): boolean => {
  return !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
};
