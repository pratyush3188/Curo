import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  UserCheck,
  Building2,
  Stethoscope,
  Activity,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getLinks = () => {
    if (user?.role === 'hospital_owner' || user?.role === 'hospital_admin') {
      return [
        { name: 'Owner Overview', path: '/hospital/owner', icon: LayoutDashboard },
        { name: 'Clinical Alerts', path: '/hospital/owner#alerts', icon: AlertTriangle },
        { name: 'Live ICU Telemetry', path: '/hospital/live', icon: Activity },
      ];
    }
    if (user?.role === 'manager') {
      return [
        { name: 'Department Dashboard', path: '/hospital/manager', icon: LayoutDashboard },
        { name: 'High-Risk Alerts', path: '/hospital/manager#alerts', icon: AlertTriangle },
        { name: 'Live ICU Telemetry', path: '/hospital/live', icon: Activity },
      ];
    }
    if (user?.role === 'doctor') {
      return [
        { name: 'My Patient Queue', path: '/hospital/doctor', icon: Stethoscope },
        { name: 'Live ICU Telemetry', path: '/hospital/live', icon: Activity },
      ];
    }
    return [{ name: 'Home', path: '/', icon: LayoutDashboard }];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] min-h-screen flex flex-col fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 border-b border-[#E2E8F0] px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2E5F8A] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <div>
            <div className="font-bold text-base text-slate-900 tracking-tight leading-none">Curo</div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Hospital System</div>
          </div>
        </Link>
      </div>

      {/* Hospital Identity badge */}
      <div className="p-4 mx-3 my-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Building2 className="w-4 h-4 text-[#2E5F8A]" />
          <span>Apex Multi-Speciality</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {user?.department ? `${user.department} Ward` : 'Central Hospital Network'}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Hospital Navigation
        </div>
        {links.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#EBF3FA] text-[#2E5F8A] font-semibold border border-[#D0E2F2]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#2E5F8A]' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-[#E2E8F0] bg-white">
        <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] mb-2 flex items-center justify-between">
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Staff Member'}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#2E5F8A] truncate">
              {(user?.role === 'hospital_owner' || user?.role === 'hospital_admin')
                ? 'Hospital Owner'
                : user?.role?.replace('_', ' ')}
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Active on shift" />
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
