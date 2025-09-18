import { useToast } from '../contexts/ToastContext';
import { useLang } from '../contexts/LangContext';
import { revokeGoogleConsent as revokeConsent } from '../utils/googleConsent';

/**
 * React hook for Google consent revocation
 * Provides a convenient way to revoke Google OAuth consent
 */
export const useGoogleConsentRevocation = () => {
  const { showToast } = useToast();
  const { lang } = useLang();

  const revokeGoogleConsent = async (email: string): Promise<void> => {
    try {
      await revokeConsent(
        email,
        () => {
          console.log('Google consent revoked for:', email);
          showToast(
            lang === 'ar' ? 'تم إلغاء موافقة جوجل بنجاح' : 'Google consent revoked successfully'
          );
        },
        (error) => {
          console.error('Google consent revocation error:', error);
          showToast(
            lang === 'ar' ? 'فشل في إلغاء موافقة جوجل' : 'Failed to revoke Google consent'
          );
        }
      );
    } catch (error) {
      console.error('Google consent revocation error:', error);
      showToast(
        lang === 'ar' ? 'فشل في إلغاء موافقة جوجل' : 'Failed to revoke Google consent'
      );
    }
  };

  return { revokeGoogleConsent };
};