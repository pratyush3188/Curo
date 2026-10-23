export default function TriageBadge({ level }) {
  const norm = (level || '').toLowerCase();

  const configs = {
    critical: {
      label: 'CRITICAL',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-300',
      dot: 'bg-rose-600',
    },
    urgent: {
      label: 'URGENT',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-600',
    },
    'semi-urgent': {
      label: 'SEMI-URGENT',
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      dot: 'bg-yellow-500',
    },
    'non-urgent': {
      label: 'NON-URGENT',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
  };

  const current = configs[norm] || {
    label: level ? level.toUpperCase() : 'PENDING',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}
