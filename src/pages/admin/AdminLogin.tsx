import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !data.user) {
        setError('Invalid email or password.');
        return;
      }

      // Admin roles must be assigned in trusted server-side Supabase metadata.
      if (data.user.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('This account does not have administrator access.');
        return;
      }

      navigate('/admin/rooms', { replace: true });
    } catch (err) {
      console.error('Admin login failed:', err);
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Thamel Heritage Hotel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} className="inline mr-1" />
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div role="alert" className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-lg">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Administrator accounts must be created and authorized by the project owner.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
