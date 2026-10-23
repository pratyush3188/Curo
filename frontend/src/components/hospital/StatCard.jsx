export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-[#EBF3FA]',
      text: 'text-[#2E5F8A]',
      border: 'border-[#D0E2F2]',
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</div>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg ${scheme.bg} ${scheme.border} border flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${scheme.text}`} />
        </div>
      )}
    </div>
  );
}
