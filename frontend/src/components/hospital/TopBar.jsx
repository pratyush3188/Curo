import { ShieldAlert, Bell, Clock, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title, subtitle, extraAction }) {
  const { user } = useAuth();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {extraAction}

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-xs font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {user?.department
                ? `${user.department} Dept`
                : (user?.role === 'hospital_owner' || user?.role === 'hospital_admin'
                    ? 'Hospital Owner'
                    : user?.role?.replace('_', ' '))}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#EBF3FA] border border-[#D0E2F2] flex items-center justify-center text-[#2E5F8A] font-bold text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
