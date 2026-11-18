import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, Users, Calendar, Settings, LogOut, Menu, X, Bed, UserCircle, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminSession {
  email: string;
  name: string;
}

function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const applySession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!active) return;

      if (!session || session.user.app_metadata?.role !== 'admin') {
        setAdminSession(null);
        navigate('/admin/login', { replace: true });
        return;
      }

      setAdminSession({
        email: session.user.email ?? '',
        name: session.user.user_metadata?.full_name || session.user.email || 'Administrator',
      });
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  const menuItems = [
    { path: '/admin/rooms', icon: Bed, label: 'Rooms' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/team', icon: Users, label: 'Team' },
    { path: '/admin/hotel-info', icon: Settings, label: 'Hotel Info' },
    { path: '/admin/website-settings', icon: Palette, label: 'Website Appearance' },
  ];

  if (!adminSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transition-transform duration-300`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">Thamel Heritage</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 rounded-lg hover:bg-gray-800" aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2" aria-label="Admin navigation">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <Home size={20} />
            <span>View Website</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full mt-2">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Open navigation">
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <UserCircle size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{adminSession.name}</span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
