import * as React from 'react';

// Import React hooks
const { useState } = React;
import { useAuth } from '../contexts/AuthContext';
import { useGoogleConsentRevocation } from '../hooks/useGoogleConsentRevocation';
import { authApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useLang } from '../contexts/LangContext';

/**
 * Test component to demonstrate Google consent revocation functionality
 * This component can be used to test the complete Google consent revocation flow
 */
const GoogleConsentTest: React.FC = () => {
  const { user, logout } = useAuth();
  const { revokeGoogleConsent } = useGoogleConsentRevocation();
  const { showToast } = useToast();
  const { lang } = useLang();
  const [loading, setLoading] = useState(false);

  const handleRevokeConsent = async () => {
    if (!user?.email) {
      showToast(lang === 'ar' ? 'لا يوجد مستخدم مسجل الدخول' : 'No user logged in');
      return;
    }

    setLoading(true);
    try {
      // Revoke Google consent
      await revokeGoogleConsent(user.email);

      // Disconnect Google account from backend
      const response = await authApi.disconnectGoogle();
      if (response.success) {
        showToast(lang === 'ar' ? 'تم قطع الاتصال بحساب جوجل بنجاح' : 'Google account disconnected successfully');
      } else {
        showToast(lang === 'ar' ? 'فشل في قطع الاتصال بحساب جوجل' : 'Failed to disconnect Google account');
      }
    } catch (error) {
      console.error('Error revoking Google consent:', error);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء قطع الاتصال' : 'An error occurred during disconnection');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutWithRevocation = async () => {
    setLoading(true);
    try {
      // The logout function in AuthContext now automatically handles Google consent revocation
      await logout();
      showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء تسجيل الخروج' : 'An error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          {lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لاختبار إلغاء موافقة جوجل' : 'Please log in first to test Google consent revocation'}
        </p>
      </div>);

  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        {lang === 'ar' ? 'اختبار إلغاء موافقة جوجل' : 'Google Consent Revocation Test'}
      </h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            {lang === 'ar' ? 'المستخدم الحالي:' : 'Current user:'}
          </p>
          <p className="font-medium">{user.name} ({user.email})</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRevokeConsent}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

            {loading ?
            lang === 'ar' ? 'جاري المعالجة...' : 'Processing...' :

            lang === 'ar' ? 'إلغاء موافقة جوجل' : 'Revoke Google Consent'
            }
          </button>

          <button
            onClick={handleLogoutWithRevocation}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

            {loading ?
            lang === 'ar' ? 'جاري المعالجة...' : 'Processing...' :

            lang === 'ar' ? 'تسجيل الخروج مع إلغاء الموافقة' : 'Logout with Consent Revocation'
            }
          </button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            {lang === 'ar' ?
            '• الزر الأول يلغي موافقة جوجل فقط' :
            '• First button revokes Google consent only'
            }
          </p>
          <p>
            {lang === 'ar' ?
            '• الزر الثاني يسجل الخروج مع إلغاء الموافقة تلقائياً' :
            '• Second button logs out with automatic consent revocation'
            }
          </p>
        </div>
      </div>
    </div>);

};

export default GoogleConsentTest;