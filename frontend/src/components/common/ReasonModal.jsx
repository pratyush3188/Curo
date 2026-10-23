import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const ReasonModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  placeholder = 'Provide detailed justification...',
  actionText = 'Submit',
  actionType = 'danger', // danger | warning | primary
  minLength = 10,
  loading = false,
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('This field is mandatory. Please provide a reason.');
      return;
    }
    if (value.trim().length < minLength) {
      setError(`Please provide at least ${minLength} characters of explanation.`);
      return;
    }
    onSubmit(value.trim());
  };

  const btnStyle = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-sky-600 hover:bg-sky-700 text-white',
  }[actionType] || 'bg-sky-600 hover:bg-sky-700 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <textarea
              rows={4}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              placeholder={placeholder}
              className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all ${
                error
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
              autoFocus
            />
            <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
              <span>{value.trim().length} characters (min: {minLength})</span>
              <span className="text-rose-500 font-medium">{error}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer ${btnStyle}`}
            >
              {loading ? 'Submitting...' : actionText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
