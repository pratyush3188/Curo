import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Shield,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';

export const Header = ({ onToggleSidebar, onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const list = await adminService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener(DATA_CHANGE_EVENT, loadNotifications);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadNotifications);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await adminService.markAllNotificationsRead();
    loadNotifications();
  };

  const handleNotificationClick = async (notif) => {
    await adminService.markNotificationRead(notif.id);
    setNotifOpen(false);
    if (notif.targetPath) {
      navigate(notif.targetPath);
    }
  };

  // Determine Title & Breadcrumbs from URL
  const getBreadcrumbInfo = () => {
    const path = location.pathname;
    if (path.includes('/hospital-applications')) {
      return { title: 'Hospital Applications', breadcrumbs: ['Facility Management', 'Applications'] };
    }
    if (path.includes('/hospitals')) {
      return { title: 'Hospital Management', breadcrumbs: ['Facility Management', 'Hospitals'] };
    }
    if (path.includes('/clinic-applications')) {
      return { title: 'Clinic Applications', breadcrumbs: ['Facility Management', 'Applications'] };
    }
    if (path.includes('/clinics')) {
      return { title: 'Private Clinic Management', breadcrumbs: ['Facility Management', 'Clinics'] };
    }
    if (path.includes('/users')) {
      return { title: 'User & Account Management', breadcrumbs: ['Identity & Access', 'Users'] };
    }
    if (path.includes('/audit-logs')) {
      return { title: 'System Audit Logs', breadcrumbs: ['Governance', 'Audit Trail'] };
    }
    if (path.includes('/analytics')) {
      return { title: 'Reports & Analytics', breadcrumbs: ['Monitoring', 'Platform Insights'] };
    }
    if (path.includes('/settings')) {
      return { title: 'Admin Settings', breadcrumbs: ['System', 'Configuration'] };
    }
    return { title: 'Platform Overview', breadcrumbs: ['Dashboard', 'Overview'] };
  };

  const breadcrumb = getBreadcrumbInfo();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <span>CURO Admin</span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            {breadcrumb.breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <span>{b}</span>
                {i < breadcrumb.breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {breadcrumb.title}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-xs text-slate-500 dark:text-slate-400 transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden md:inline">Search platform...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-slate-400 shadow-xs">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fadeIn">
              <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Platform Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                        !notif.read ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  View full audit event logs
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              AV
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                {user?.name || 'Dr. Alok Verma'}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Dr. Alok Verma'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'admin@curo.health'}
                </p>
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  Platform Authority
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  Admin Settings
                </Link>
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  Audit Ledger
                </Link>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/admin/login');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
