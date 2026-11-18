import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function AdminResetPassword() {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    const isRecoveryLink = window.location.hash.includes('type=recovery');

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setRecoveryReady(true);
        setError('');
        setChecking(false);
      }
    });

    const checkSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (!sessionError && data.session && isRecoveryLink) {
        setRecoveryReady(true);
      } else if (sessionError) {
        setError('This password-reset link is invalid or has expired. Request a new one from the admin login page.');
      }
      setChecking(false);
    };

    void checkSession();
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess('Your password has been updated. Redirecting to admin login...');
      await supabase.auth.signOut();
      window.setTimeout(() => navigate('/admin/login', { replace: true }), 1200);
    } catch (err) {
      console.error('Password update failed:', err);
      setError(err instanceof Error ? err.message : 'Could not update your password. Request a fresh reset link and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set a new password</h1>
          <p className="text-gray-600">Create a new password for your hotel administrator account.</p>
        </div>

        {checking ? (
          <p className="text-center text-gray-600">Verifying your recovery link...</p>
        ) : !recoveryReady ? (
          <div className="space-y-4">
            {error && (
              <div role="alert" className="flex gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/admin/login', { replace: true })}
              className="w-full bg-amber-700 text-white py-3 rounded-lg font-semibold hover:bg-amber-800"
            >
              Back to admin login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter the password again"
              />
            </div>
            {error && (
              <div role="alert" className="flex gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div role="status" className="flex gap-2 text-green-700 bg-green-50 p-3 rounded-lg text-sm">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={saving || Boolean(success)}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 disabled:opacity-50"
            >
              {saving ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminResetPassword;
