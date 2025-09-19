import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSafe } from '../contexts/AuthContext';

interface AuthGuardOptions {
  action?: string; // Description of the action being performed
  redirectAfterAuth?: string; // Where to redirect after successful auth
  onSuccess?: () => void; // Callback to execute after successful auth
}

export function useAuthGuard() {
  const auth = useAuthSafe();
  const isAuthenticated = auth?.isAuthenticated || false;
  const user = auth?.user;
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'login_required' | 'account_not_found'>('login_required');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [actionDescription, setActionDescription] = useState<string>('');

  const requireAuth = useCallback((action: () => void, options: AuthGuardOptions = {}) => {
    if (isAuthenticated && user) {
      // User is authenticated, proceed with action
      action();
      if (options.onSuccess) {
        options.onSuccess();
      }
    } else {
      // User is not authenticated, show warning
      setPendingAction(() => action);
      setActionDescription(options.action || '');
      setWarningType('login_required');
      setShowWarning(true);
    }
  }, [isAuthenticated, user]);

  const handleLoginClick = useCallback(() => {
    setShowWarning(false);
    navigate('/login');
  }, [navigate]);

  const handleSignUpClick = useCallback(() => {
    setShowWarning(false);
    navigate('/register');
  }, [navigate]);

  const handleCloseWarning = useCallback(() => {
    setShowWarning(false);
    setPendingAction(null);
    setActionDescription('');
  }, []);

  const handleInvalidAccount = useCallback((action: () => void, options: AuthGuardOptions = {}) => {
    setPendingAction(() => action);
    setActionDescription(options.action || '');
    setWarningType('account_not_found');
    setShowWarning(true);
  }, []);

  const executePendingAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
      setActionDescription('');
      return true; // Indicates action was executed
    }
    return false; // No pending action
  }, [pendingAction]);

  return {
    // State
    showWarning,
    warningType,
    actionDescription,
    isAuthenticated,
    user,

    // Actions
    requireAuth,
    handleLoginClick,
    handleSignUpClick,
    handleCloseWarning,
    handleInvalidAccount,
    executePendingAction,

    // Utilities
    setShowWarning
  };
}