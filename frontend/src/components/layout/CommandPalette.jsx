import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Stethoscope, Users, Mail, FileText, ArrowRight, X } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [hospitals, clinics, users] = await Promise.all([
          adminService.getHospitals({ search: query }),
          adminService.getClinics({ search: query }),
          adminService.getUsers({ search: query }),
        ]);

        const combined = [
          ...hospitals.slice(0, 3).map((h) => ({
            id: h.id,
            title: h.name,
            subtitle: `${h.city}, ${h.state} • ${h.departmentsCount} Departments`,
            category: 'Hospital',
            icon: Building2,
            path: `/admin/hospitals?search=${encodeURIComponent(h.name)}`,
          })),
          ...clinics.slice(0, 3).map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: `${c.category || 'Specialty Clinic'} • ${c.city}`,
            category: 'Private Clinic',
            icon: Stethoscope,
            path: `/admin/clinics?search=${encodeURIComponent(c.name)}`,
          })),
          ...users.slice(0, 3).map((u) => ({
            id: u.id,
            title: u.name,
            subtitle: `${u.email} • ${u.role.replace('_', ' ')}`,
            category: 'User',
            icon: Users,
            path: `/admin/users?search=${encodeURIComponent(u.name)}`,
          })),
        ];

        setResults(combined);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDownList = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownList}
            placeholder="Search hospitals, clinics, users, applications, or actions..."
            className="w-full py-4 text-base bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="p-6 text-center text-xs text-slate-400">
              Searching platform records...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              No matching healthcare facilities, applications, or users found for "{query}".
            </div>
          )}

          {!query && (
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                Quick Navigation Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    navigate('/admin/hospital-applications');
                    onClose();
                  }}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hospital Application Queue
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/clinic-applications');
                    onClose();
                  }}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Clinic Application Queue
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/analytics');
                    onClose();
                  }}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Platform Analytics & Metrics
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/audit-logs');
                    onClose();
                  }}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    System Audit Logs
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={`${item.category}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {item.category}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono shadow-xs">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono shadow-xs">
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono shadow-xs">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">CURO Search</span>
        </div>
      </div>
    </div>
  );
};
