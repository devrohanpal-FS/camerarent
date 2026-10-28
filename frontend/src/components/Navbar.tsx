import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, BarChart2, Menu, X, Bell } from 'lucide-react';
import FlipLogo from './FlipLogo';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useNotificationStore } from '../store/notificationStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { notifications, fetchNotifications, markAsRead, markAllRead } = useNotificationStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navMenu = [
    { label: 'Home', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchNotifications();
    }
  }, [user, fetchCart, fetchNotifications]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
        <FlipLogo />

      <div className="hidden lg:flex items-center gap-6">
        {navMenu.map((item: any, idx: number) => (
          <Link
            key={idx}
            to={item.path}
            className="text-sm text-slate-600 hover:text-brand-600 transition font-semibold"
          >
            {item.label}
          </Link>
        ))}

        {user && user.role === 'ADMIN' && (
          <Link to="/admin" className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition font-semibold">
            <BarChart2 className="w-4 h-4" />
            Admin
          </Link>
        )}

        {user && user.role === 'CUSTOMER' && (
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 transition font-semibold">
            <User className="w-4 h-4" />
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-brand-600 transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white border border-slate-100 rounded-2xl shadow-xl p-3.5 z-[999] text-xs">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-2">
                    <span className="font-extrabold text-slate-800">Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-[10px] text-brand-600 hover:underline font-bold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 font-medium">No notifications yet.</p>
                    ) : (
                      notifications.map((n: any) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                          }}
                          className={`p-2.5 rounded-xl border transition cursor-pointer text-left ${
                            n.read 
                              ? 'bg-white border-slate-50 hover:bg-slate-50' 
                              : 'bg-brand-50/40 border-brand-100 hover:bg-brand-50/60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`font-bold text-[11px] ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                              {n.title}
                            </span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">{n.message}</p>
                          <span className="text-[8px] text-slate-400 block mt-1">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user.role !== 'VENDOR' && (
              <Link to="/cart" className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-brand-600 transition-all">
                <ShoppingCart className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-gentle">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-100">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{user.name}</p>
                <span className="text-[10px] text-brand-600 font-mono tracking-wider uppercase font-bold">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-slate-50 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-brand-500/20 hover:scale-[1.02] transition"
            >
              Sign Up
            </Link>
          </div>
        )}

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-slate-50 text-slate-600 lg:hidden focus:outline-none transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl z-50 p-6 flex flex-col gap-6 lg:hidden animate-fade-in">
          <div className="flex flex-col gap-4">
            {navMenu.map((item: any, idx: number) => (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-700 hover:text-brand-600 transition"
              >
                {item.label}
              </Link>
            ))}

            {user && user.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition"
              >
                <BarChart2 className="w-4 h-4" /> Admin
              </Link>
            )}

            {user && user.role === 'CUSTOMER' && (
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-brand-600 transition"
              >
                <User className="w-4 h-4" /> Dashboard
              </Link>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{user.name}</p>
                  <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-bold py-2 px-3 rounded-lg hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs font-bold text-slate-600 hover:text-slate-800 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 py-3 rounded-xl transition shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
