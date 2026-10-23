import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Building,
  Bell,
  Lock,
  Palette,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Mail,
  User,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const { success, warning, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings form states
  const [settings, setSettings] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await adminService.getAdminSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.updateAdminSettings(settings);
      success('Platform administration settings updated successfully.');
    } catch (err) {
      toastError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      await adminService.resetDemoData();
      await loadSettings();
      setResetModalOpen(false);
      warning('Platform demo data reset to pristine seed state.');
    } catch (e) {
      void e;
      toastError('Failed to reset demo data');
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Platform & Governance Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system parameters, hospital review SLAs, branding identity, and authentication rules.
          </p>
        </div>

        <button
          onClick={() => setResetModalOpen(true)}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Demo Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { key: 'branding', label: 'Platform & Branding', icon: Building },
          { key: 'profile', label: 'Super Admin Profile', icon: User },
          { key: 'review', label: 'Review & Verification SLA', icon: Shield },
          { key: 'security', label: 'Security & Sessions', icon: Lock },
          { key: 'appearance', label: 'Theme & Appearance', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          {/* TAB 1: Platform & Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Platform Identity & Public Name
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Controls the platform branding rendered in the sidebar, header, and official notices.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Platform Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Modifying this immediately updates the sidebar and portal header title.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Platform Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Platform Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Emergency Clinical Hotline
                    </label>
                    <input
                      type="text"
                      value={settings.emergencyHotline}
                      onChange={(e) => setSettings({ ...settings, emergencyHotline: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Super Admin Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Super Administrator Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Officer details affixed to verification approvals and compliance audit logs.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Officer Name
                    </label>
                    <input
                      type="text"
                      value={settings.adminProfile?.name || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          adminProfile: { ...settings.adminProfile, name: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Official Designation
                    </label>
                    <input
                      type="text"
                      value={settings.adminProfile?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          adminProfile: { ...settings.adminProfile, title: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Administrator Email
                    </label>
                    <input
                      type="email"
                      value={settings.adminProfile?.email || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          adminProfile: { ...settings.adminProfile, email: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={settings.adminProfile?.timezone || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          adminProfile: { ...settings.adminProfile, timezone: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Review & Verification Preferences */}
          {activeTab === 'review' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verification Queue SLA & Requirements
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rules for processing submitted NABH certificates and medical licenses.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reviewPreferences?.requireAllDocuments}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reviewPreferences: {
                          ...settings.reviewPreferences,
                          requireAllDocuments: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Enforce Mandatory Regulatory Documents
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Require Clinical Establishment license and pollution NOC before allowing approval.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reviewPreferences?.emailAlertsOnSubmission}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reviewPreferences: {
                          ...settings.reviewPreferences,
                          emailAlertsOnSubmission: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Dispatch High-Priority Super Admin Alerts
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Trigger in-app notification when a new hospital or clinic registers.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Verification SLA Warning Threshold (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={settings.reviewPreferences?.verificationSlaDays || 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reviewPreferences: {
                          ...settings.reviewPreferences,
                          verificationSlaDays: parseInt(e.target.value, 10),
                        },
                      })
                    }
                    className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Applications pending longer than this threshold trigger priority badges.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Session Preferences */}
          {activeTab === 'security' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Access Controls & Compliance Parameters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Global security baselines applied across platform manager roles.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.securityPreferences?.enforce2FAForFacilityManagers}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        securityPreferences: {
                          ...settings.securityPreferences,
                          enforce2FAForFacilityManagers: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Mandatory Multi-Factor Authentication (MFA)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Require TOTP or SMS verification for all hospital and clinic managers on account activation.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Super Admin Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={settings.securityPreferences?.sessionTimeoutMinutes || 60}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        securityPreferences: {
                          ...settings.securityPreferences,
                          sessionTimeoutMinutes: parseInt(e.target.value, 10),
                        },
                      })
                    }
                    className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Theme & Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Color Mode & Surface Presentation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your interface appearance preference (Default: Light).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    theme === 'light'
                      ? 'border-sky-600 bg-sky-50/40 dark:bg-sky-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-20 bg-slate-100 rounded-xl border border-slate-300/60 p-2 flex flex-col gap-1.5">
                    <div className="h-3 w-1/3 bg-slate-300 rounded"></div>
                    <div className="h-2 w-full bg-slate-200 rounded"></div>
                    <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Light Theme (Default)
                    </span>
                    {theme === 'light' && <Check className="w-4 h-4 text-sky-600" />}
                  </div>
                </div>

                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    theme === 'dark'
                      ? 'border-sky-600 bg-sky-50/40 dark:bg-sky-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-20 bg-slate-900 rounded-xl border border-slate-800 p-2 flex flex-col gap-1.5">
                    <div className="h-3 w-1/3 bg-slate-700 rounded"></div>
                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                    <div className="h-2 w-2/3 bg-slate-800 rounded"></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Dark Theme
                    </span>
                    {theme === 'dark' && <Check className="w-4 h-4 text-sky-600" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Submit Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={loadSettings}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Reset Demo Data Modal */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetDemoData}
        type="danger"
        title="Reset All Platform Demo Data?"
        message="This will restore all 8+ hospitals, 10+ clinics, invitations, users, and audit logs back to their initial seeded demo states. Any demo modifications will be cleared."
        confirmText="Confirm Demo Reset"
      />
    </div>
  );
}
