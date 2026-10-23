import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Stethoscope,
  FileCheck2,
  Users,
  Mail,
  History,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const [platformName, setPlatformName] = useState('CURO Admin');
  const [badges, setBadges] = useState({
    hospitalApps: 0,
    clinicApps: 0,
    invitations: 0,
  });
  const [facilitiesOpen, setFacilitiesOpen] = useState(true);
  const [accessOpen, setAccessOpen] = useState(true);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const loadSidebarData = async () => {
    try {
      const [settings, stats] = await Promise.all([
        adminService.getAdminSettings(),
        adminService.getDashboardStats(),
      ]);
      if (settings?.platformName) {
        setPlatformName(settings.platformName === 'MediCore Admin' ? 'CURO Admin' : settings.platformName);
      }
      setBadges({
        hospitalApps: stats.pendingHospitalApps || 0,
        clinicApps: stats.pendingClinicApps || 0,
        invitations: stats.pendingInvitationsCount || 0,
      });
    } catch (err) {
      console.error('Sidebar data error:', err);
    }
  };

  useEffect(() => {
    loadSidebarData();
    window.addEventListener(DATA_CHANGE_EVENT, loadSidebarData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadSidebarData);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-sky-600 text-white shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  const renderBadge = (count, active = false) => {
    if (!count) return null;
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
        }`}
      >
        {count}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-xs shadow-sky-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight">
                {platformName}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Super Admin
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Main / Core Section */}
          <div className="space-y-1">
            <NavLink to="/admin/overview" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </NavLink>
          </div>

          {/* Group: Facility Management */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setFacilitiesOpen(!facilitiesOpen)}
              className="w-full flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              <span>Facility Management</span>
              {facilitiesOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {facilitiesOpen && (
              <div className="space-y-1 pt-1">
                <NavLink to="/admin/hospitals" onClick={onClose} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4" />
                    <span>Hospitals</span>
                  </div>
                </NavLink>

                <NavLink to="/admin/hospital-applications" onClick={onClose} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Hospital Applications</span>
                      </div>
                      {renderBadge(badges.hospitalApps, isActive)}
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/clinics" onClick={onClose} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-4 h-4" />
                    <span>Private Clinics</span>
                  </div>
                </NavLink>

                <NavLink to="/admin/clinic-applications" onClick={onClose} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <FileCheck2 className="w-4 h-4" />
                        <span>Clinic Applications</span>
                      </div>
                      {renderBadge(badges.clinicApps, isActive)}
                    </>
                  )}
                </NavLink>
              </div>
            )}
          </div>

          {/* Group: Identity & Access */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setAccessOpen(!accessOpen)}
              className="w-full flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              <span>Identity & Accounts</span>
              {accessOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {accessOpen && (
              <div className="space-y-1 pt-1">
                <NavLink to="/admin/users" onClick={onClose} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>User & Account Management</span>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group: Governance & Analytics */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Monitoring & Insights
            </div>
            <div className="space-y-1 pt-1">
              <NavLink to="/admin/audit-logs" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4" />
                  <span>Audit Logs</span>
                </div>
              </NavLink>

              <NavLink to="/admin/analytics" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports & Analytics</span>
                </div>
              </NavLink>

              <NavLink to="/admin/settings" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>Admin Settings</span>
                </div>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Bottom Sign Out */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
