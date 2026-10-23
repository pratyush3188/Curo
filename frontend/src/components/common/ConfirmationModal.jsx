import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // danger | warning | info
  loading = false,
  children,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      iconBg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400',
      icon: AlertCircle,
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400',
      icon: AlertTriangle,
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    },
    info: {
      iconBg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400',
      icon: Info,
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500',
    },
  }[type] || {
    iconBg: 'bg-slate-100 text-slate-600',
    icon: Info,
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const IconComponent = typeConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.iconBg}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            {message && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            )}

            {children && <div className="mt-4">{children}</div>}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer ${typeConfig.confirmBtn}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
