import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import type { HotelInfo, SiteSettings } from '../types';
import { getHotelInfo, getSiteSettings } from '../lib/api';

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function fetchHotelInfo() {
      try {
        const info = await getHotelInfo();
        setHotelInfo(info);
      } catch (error) {
        console.error('Failed to fetch hotel info:', error);
      }
    }
    fetchHotelInfo();
    getSiteSettings().then(setSiteSettings).catch((error) => console.error('Failed to fetch website settings:', error));
  }, []);

  useEffect(() => {
    const theme = siteSettings?.theme;
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--site-primary', theme.primary || '#d97706');
    root.style.setProperty('--site-secondary', theme.secondary || '#1f2937');
    root.style.setProperty('--site-accent', theme.accent || '#f59e0b');
    root.style.setProperty('--site-background', theme.background || '#f9fafb');
    root.style.setProperty('--site-text', theme.text || '#111827');
    const palette = (hex: string, prefix: string) => {
      const clean = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'd97706';
      const rgb = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
      const shades: Record<number, number> = { 50: 0.94, 100: 0.86, 200: 0.72, 300: 0.55, 400: 0.34, 500: 0.16, 600: 0, 700: -0.15, 800: -0.30, 900: -0.45, 950: -0.60 };
      Object.entries(shades).forEach(([shade, amount]) => {
        const channels = rgb.map((channel) => Math.round(channel * (1 - Math.abs(amount)) + (amount >= 0 ? 255 : 0) * Math.abs(amount)));
        root.style.setProperty('--site-' + prefix + '-' + shade, channels.join(' '));
      });
    };
    palette(theme.primary || '#d97706', 'amber');
    palette(theme.accent || '#f59e0b', 'orange');
  }, [siteSettings]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className={`text-xl font-serif font-bold transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}>
                  {hotelInfo?.name || 'Thamel Heritage Hotel'}
                </h1>
                <p className={`text-xs transition-colors ${
                  isScrolled ? 'text-gray-600' : 'text-amber-100'
                }`}>
                  {hotelInfo?.address || 'Hotel location'}
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {[
                { path: '/', label: 'Home' },
                { path: '/rooms', label: 'Rooms' },
                { path: '/about', label: 'About' },
                { path: '/team', label: 'Our Team' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`font-medium transition-colors hover:text-amber-600 ${
                    location.pathname === item.path
                      ? 'text-amber-600'
                      : isScrolled
                      ? 'text-gray-700'
                      : 'text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/rooms"
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2.5 rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg"
              >
                Book Now
              </Link>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled ? 'text-gray-700' : 'text-white'
              }`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-xl">
            <nav className="max-w-7xl mx-auto px-4 py-6 space-y-4">
              {[
                { path: '/', label: 'Home' },
                { path: '/rooms', label: 'Rooms' },
                { path: '/about', label: 'About' },
                { path: '/team', label: 'Our Team' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2 rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/rooms"
                className="block px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg text-center font-medium"
              >
                Book Now
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow">
        <Outlet context={{ hotelInfo, siteSettings }} />
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold">
                    {hotelInfo?.name || 'Thamel Heritage Hotel'}
                  </h3>
                  <p className="text-amber-100 text-sm">Est. {hotelInfo?.opening_year || 2010}</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                {hotelInfo?.description || 'Nestled in the vibrant streets of Thamel, our hotel offers a perfect blend of traditional Nepali hospitality and modern comfort.'}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {[{ label: 'Rooms', path: '/rooms' }, { label: 'About', path: '/about' }, { label: 'Our Team', path: '/team' }, { label: 'Book Now', path: '/rooms' }].map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-gray-400 hover:text-amber-500 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <MapPin size={20} className="text-amber-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-400">
                    {hotelInfo?.address || 'Thamel, Kathmandu, Nepal'}
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone size={20} className="text-amber-500" />
                  <a
                    href={`tel:${hotelInfo?.phone || '+977-1-4700000'}`}
                    className="text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    {hotelInfo?.phone || '+977-1-4700000'}
                  </a>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail size={20} className="text-amber-500" />
                  <a
                    href={`mailto:${hotelInfo?.email || 'info@thamelheritage.com'}`}
                    className="text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    {hotelInfo?.email || 'info@thamelheritage.com'}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-500 text-sm">
                {new Date().getFullYear()} {hotelInfo?.name || 'Thamel Heritage Hotel'}. All rights reserved.
              </p>
              <Link
                to="/admin/login"
                className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
