import {
  INITIAL_SETTINGS,
  INITIAL_HOSPITALS,
  INITIAL_CLINICS,
  INITIAL_USERS,
  INITIAL_INVITATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './seedData';
import adminApi from './adminApi';

export const STORAGE_KEYS = {
  HOSPITALS: 'curo_hospitals_v1',
  CLINICS: 'curo_clinics_v1',
  USERS: 'curo_users_v1',
  INVITATIONS: 'curo_invitations_v1',
  AUDIT_LOGS: 'curo_audit_logs_v1',
  SETTINGS: 'curo_settings_v1',
  NOTIFICATIONS: 'curo_notifications_v1',
};

// Custom event name for notifying components of state changes
export const DATA_CHANGE_EVENT = 'curo_data_changed';

export const notifyChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT));
  }
};

// Safe storage access with automatic legacy migration fallback
const getStored = (key, fallback) => {
  try {
    let raw = localStorage.getItem(key);
    if (!raw) {
      const legacyKey = key.replace('curo_', 'medicore_');
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(key, raw);
      }
    }
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.platformName === 'MediCore Admin') {
      parsed.platformName = 'CURO Admin';
      localStorage.setItem(key, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
};

const setStored = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyChange();
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
};

// Simulated network latency for offline fallback
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

/* =====================================================================
   ADMIN SERVICE IMPLEMENTATION (Integrated Real Backend + Offline Cache)
===================================================================== */
export const adminService = {
  /**
   * Reset all mock / database data to clean initial seeds
   */
  async resetDemoData() {
    try {
      await adminApi.resetDemoData();
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Also reset local storage caches to keep offline mode consistent
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(INITIAL_CLINICS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(INITIAL_INVITATIONS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));

    notifyChange();
    return true;
  },

  /* -------------------------------------------------------------
     SETTINGS
  ------------------------------------------------------------- */
  async getAdminSettings() {
    try {
      const data = await adminApi.getSettings();
      if (data) return data;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(60);
    const settings = getStored(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (settings && settings.platformName === 'MediCore Admin') {
      settings.platformName = 'CURO Admin';
      setStored(STORAGE_KEYS.SETTINGS, settings);
    }
    return settings;
  },

  async updateAdminSettings(newSettings) {
    try {
      const updated = await adminApi.updateSettings(newSettings);
      notifyChange();
      return updated;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(150);
    const current = getStored(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const updated = { ...current, ...newSettings };
    setStored(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  /* -------------------------------------------------------------
     NOTIFICATIONS (Client-side alerts ledger)
  ------------------------------------------------------------- */
  async getNotifications() {
    await delay(50);
    return getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  async markNotificationRead(id) {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  async markAllNotificationsRead() {
    const list = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = list.map((n) => ({ ...n, read: true }));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  async clearNotifications() {
    setStored(STORAGE_KEYS.NOTIFICATIONS, []);
    return [];
  },

  /* -------------------------------------------------------------
     AUDIT LOGS
  ------------------------------------------------------------- */
  async getAuditLogs(filters = {}) {
    try {
      const res = await adminApi.getAuditLogs(filters);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(100);
    let logs = getStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.targetName?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) ||
          l.actor?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      );
    }
    if (filters.action && filters.action !== 'all') {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters.targetType && filters.targetType !== 'all') {
      logs = logs.filter((l) => l.targetType === filters.targetType);
    }
    if (filters.outcome && filters.outcome !== 'all') {
      logs = logs.filter((l) => l.outcome === filters.outcome);
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async addAuditLog({ action, targetType, targetId, targetName, outcome = 'success', details = '' }) {
    // Audit logs are automatically recorded on the backend during mutations.
    // In offline mode, append to local storage:
    const logs = getStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog = {
      id: `aud-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      actor: 'Dr. Alok Verma (Super Admin)',
      action,
      targetType,
      targetId,
      targetName,
      outcome,
      details,
    };
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  },

  /* -------------------------------------------------------------
     DASHBOARD STATS
  ------------------------------------------------------------- */
  async getDashboardStats() {
    try {
      const stats = await adminApi.getDashboardStats();
      if (stats) return stats;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(80);
    const hospitals = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const clinics = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const invitations = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    const logs = getStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);

    const totalHospitals = hospitals.length;
    const verifiedHospitals = hospitals.filter((h) => h.verificationStatus === 'approved').length;
    const pendingHospitalApps = hospitals.filter(
      (h) => h.verificationStatus === 'pending' || h.verificationStatus === 'under_review' || h.verificationStatus === 'needs_more_information'
    ).length;

    const totalClinics = clinics.length;
    const verifiedClinics = clinics.filter((c) => c.verificationStatus === 'approved').length;
    const pendingClinicApps = clinics.filter(
      (c) => c.verificationStatus === 'pending' || c.verificationStatus === 'under_review' || c.verificationStatus === 'needs_more_information'
    ).length;

    const doctorsCount = 84;
    const patientsCount = 1420;
    const activeFacilityAccounts =
      hospitals.filter((h) => h.accountStatus === 'active').length +
      clinics.filter((c) => c.accountStatus === 'active').length;

    const pendingInvitationsCount = invitations.filter((i) => i.status === 'pending').length;

    const allRecentApps = [
      ...hospitals.map((h) => ({ ...h, facilityType: 'hospital' })),
      ...clinics.map((c) => ({ ...c, facilityType: 'clinic' })),
    ].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

    const recentlyActivated = [
      ...hospitals.filter((h) => h.accountStatus === 'active').map((h) => ({ ...h, facilityType: 'hospital' })),
      ...clinics.filter((c) => c.accountStatus === 'active').map((c) => ({ ...c, facilityType: 'clinic' })),
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

    return {
      totalHospitals,
      verifiedHospitals,
      pendingHospitalApps,
      totalClinics,
      verifiedClinics,
      pendingClinicApps,
      doctorsCount,
      patientsCount,
      activeFacilityAccounts,
      pendingInvitationsCount,
      recentApplications: allRecentApps.slice(0, 6),
      recentlyActivated,
      recentActivities: logs.slice(0, 7),
    };
  },

  /* -------------------------------------------------------------
     HOSPITALS MANAGEMENT & APPLICATIONS
  ------------------------------------------------------------- */
  async getHospitals(filters = {}) {
    try {
      const res = await adminApi.getHospitals(filters);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(100);
    let list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.regId.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q) ||
          h.email.toLowerCase().includes(q)
      );
    }
    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      list = list.filter((h) => h.verificationStatus === filters.verificationStatus);
    }
    if (filters.accountStatus && filters.accountStatus !== 'all') {
      list = list.filter((h) => h.accountStatus === filters.accountStatus);
    }
    if (filters.state && filters.state !== 'all') {
      list = list.filter((h) => h.state === filters.state);
    }

    if (filters.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'departments') {
      list.sort((a, b) => (b.departmentsCount || 0) - (a.departmentsCount || 0));
    } else {
      list.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    }

    return list;
  },

  async getHospitalById(id) {
    try {
      const hosp = await adminApi.getHospitalById(id);
      if (hosp) return hosp;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    await delay(60);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    return list.find((h) => h.id === id || h._id === id) || null;
  },

  async markHospitalUnderReview(id, note = '') {
    try {
      const res = await adminApi.reviewApplication(id, 'hospital');
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const item = list.find((h) => h.id === id || h._id === id);
    if (!item) throw new Error('Hospital not found');

    item.verificationStatus = 'under_review';
    item.updatedAt = new Date().toISOString();
    if (note) item.reviewNotes = note;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Marked Under Review: ${note || 'Super Admin initiated regulatory document verification.'}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.HOSPITALS, list);
    return item;
  },

  async approveHospital(id, notes = '', credentials = {}) {
    try {
      const res = await adminApi.approveApplication(id, {
        reviewNotes: notes,
        facilityType: 'hospital',
        assignEmail: credentials.assignEmail,
        assignPassword: credentials.assignPassword,
      });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(150);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const item = list.find((h) => h.id === id || h._id === id);
    if (!item) throw new Error('Hospital not found');

    item.verificationStatus = 'approved';
    if (item.accountStatus === 'inactive') {
      item.accountStatus = 'pending_activation';
    }
    item.updatedAt = new Date().toISOString();
    if (notes) item.reviewNotes = notes;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Application Approved: ${notes || 'Hospital verification confirmed by Super Admin.'}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.HOSPITALS, list);
    return item;
  },

  async rejectHospital(id, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('A mandatory rejection reason is required.');
    }

    try {
      const res = await adminApi.rejectApplication(id, { reason: reason.trim(), facilityType: 'hospital' });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(150);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const item = list.find((h) => h.id === id || h._id === id);
    if (!item) throw new Error('Hospital not found');

    item.verificationStatus = 'rejected';
    item.accountStatus = 'inactive';
    item.updatedAt = new Date().toISOString();
    item.reviewNotes = `Rejected: ${reason.trim()}`;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Application Rejected: ${reason.trim()}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.HOSPITALS, list);
    return item;
  },

  async requestHospitalInformation(id, message) {
    if (!message || !message.trim()) {
      throw new Error('A mandatory message is required to request more information.');
    }

    try {
      const res = await adminApi.requestMoreInfo(id, { message: message.trim(), facilityType: 'hospital' });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const item = list.find((h) => h.id === id || h._id === id);
    if (!item) throw new Error('Hospital not found');

    item.verificationStatus = 'needs_more_information';
    item.updatedAt = new Date().toISOString();
    item.reviewNotes = `Additional Information Requested: ${message.trim()}`;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Additional Information Requested: ${message.trim()}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.HOSPITALS, list);
    return item;
  },

  async suspendHospital(id, reason = 'Super Admin discretionary suspension') {
    try {
      const res = await adminApi.updateHospitalStatus(id, { status: 'suspended', reason });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const item = list.find((h) => h.id === id || h._id === id);
    if (!item) throw new Error('Hospital not found');

    item.accountStatus = 'suspended';
    item.updatedAt = new Date().toISOString();
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Facility Account Suspended: ${reason}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.HOSPITALS, list);
    return item;
  },

  async reactivateHospital(id) {
    try {
      const res = await adminApi.updateHospitalStatus(id, { status: 'active' });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const item = list.find((h) => h.id === id || h._id === id);
    if (!item) throw new Error('Hospital not found');

    item.accountStatus = 'active';
    item.updatedAt = new Date().toISOString();
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: 'Facility Account Reactivated by Super Admin after compliance clearance',
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.HOSPITALS, list);
    return item;
  },

  /* -------------------------------------------------------------
     CLINICS MANAGEMENT & APPLICATIONS
  ------------------------------------------------------------- */
  async getClinics(filters = {}) {
    try {
      const res = await adminApi.getClinics(filters);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(100);
    let list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.regId.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }
    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      list = list.filter((c) => c.verificationStatus === filters.verificationStatus);
    }
    if (filters.accountStatus && filters.accountStatus !== 'all') {
      list = list.filter((c) => c.accountStatus === filters.accountStatus);
    }
    if (filters.state && filters.state !== 'all') {
      list = list.filter((c) => c.state === filters.state);
    }

    if (filters.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'doctors') {
      list.sort((a, b) => (b.doctorsCount || 0) - (a.doctorsCount || 0));
    } else {
      list.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    }

    return list;
  },

  async getClinicById(id) {
    try {
      const clinic = await adminApi.getClinicById(id);
      if (clinic) return clinic;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    await delay(60);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    return list.find((c) => c.id === id || c._id === id) || null;
  },

  async markClinicUnderReview(id, note = '') {
    try {
      const res = await adminApi.reviewApplication(id, 'clinic');
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const item = list.find((c) => c.id === id || c._id === id);
    if (!item) throw new Error('Clinic not found');

    item.verificationStatus = 'under_review';
    item.updatedAt = new Date().toISOString();
    if (note) item.reviewNotes = note;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Marked Under Review: ${note || 'Super Admin initiated clinic verification.'}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.CLINICS, list);
    return item;
  },

  async approveClinic(id, notes = '', credentials = {}) {
    try {
      const res = await adminApi.approveApplication(id, {
        reviewNotes: notes,
        facilityType: 'clinic',
        assignEmail: credentials.assignEmail,
        assignPassword: credentials.assignPassword,
      });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(150);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const item = list.find((c) => c.id === id || c._id === id);
    if (!item) throw new Error('Clinic not found');

    item.verificationStatus = 'approved';
    if (item.accountStatus === 'inactive') {
      item.accountStatus = 'pending_activation';
    }
    item.updatedAt = new Date().toISOString();
    if (notes) item.reviewNotes = notes;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Application Approved: ${notes || 'Clinic credentials validated.'}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.CLINICS, list);
    return item;
  },

  async rejectClinic(id, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('A mandatory rejection reason is required.');
    }

    try {
      const res = await adminApi.rejectApplication(id, { reason: reason.trim(), facilityType: 'clinic' });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(150);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const item = list.find((c) => c.id === id || c._id === id);
    if (!item) throw new Error('Clinic not found');

    item.verificationStatus = 'rejected';
    item.accountStatus = 'inactive';
    item.updatedAt = new Date().toISOString();
    item.reviewNotes = `Rejected: ${reason.trim()}`;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Application Rejected: ${reason.trim()}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.CLINICS, list);
    return item;
  },

  async requestClinicInformation(id, message) {
    if (!message || !message.trim()) {
      throw new Error('A mandatory message is required to request more information.');
    }

    try {
      const res = await adminApi.requestMoreInfo(id, { message: message.trim(), facilityType: 'clinic' });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const item = list.find((c) => c.id === id || c._id === id);
    if (!item) throw new Error('Clinic not found');

    item.verificationStatus = 'needs_more_information';
    item.updatedAt = new Date().toISOString();
    item.reviewNotes = `Additional Information Requested: ${message.trim()}`;
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Additional Information Requested: ${message.trim()}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.CLINICS, list);
    return item;
  },

  async suspendClinic(id, reason = 'Super Admin discretionary suspension') {
    try {
      const res = await adminApi.updateClinicStatus(id, { status: 'suspended', reason });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const item = list.find((c) => c.id === id || c._id === id);
    if (!item) throw new Error('Clinic not found');

    item.accountStatus = 'suspended';
    item.updatedAt = new Date().toISOString();
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: `Clinic Suspended: ${reason}`,
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.CLINICS, list);
    return item;
  },

  async reactivateClinic(id) {
    try {
      const res = await adminApi.updateClinicStatus(id, { status: 'active' });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const item = list.find((c) => c.id === id || c._id === id);
    if (!item) throw new Error('Clinic not found');

    item.accountStatus = 'active';
    item.updatedAt = new Date().toISOString();
    item.timeline.unshift({
      date: new Date().toISOString(),
      event: 'Clinic Reactivated by Super Admin',
      actor: 'Super Admin',
    });

    setStored(STORAGE_KEYS.CLINICS, list);
    return item;
  },

  /* -------------------------------------------------------------
     MANAGER INVITATIONS & ACCOUNT ACTIVATION
  ------------------------------------------------------------- */
  async getInvitations(filters = {}) {
    try {
      const res = await adminApi.getInvitations(filters);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(100);
    let list = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.inviteeName.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.facilityName.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter((i) => i.status === filters.status);
    }
    if (filters.role && filters.role !== 'all') {
      list = list.filter((i) => i.role === filters.role);
    }
    if (filters.facilityType && filters.facilityType !== 'all') {
      list = list.filter((i) => i.facilityType === filters.facilityType);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getInvitationsByFacilityId(facilityId) {
    try {
      const res = await adminApi.getInvitations({ facilityId });
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    await delay(60);
    const list = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    return list.filter((i) => i.facilityId === facilityId);
  },

  async createManagerInvitation({
    facilityId,
    facilityType,
    facilityName,
    inviteeName,
    email,
    phone = '',
    role,
  }) {
    try {
      const res = await adminApi.createInvitation({
        facilityId,
        facilityType,
        facilityName,
        inviteeName,
        email,
        phone,
        role,
      });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(150);
    if (!inviteeName || !inviteeName.trim()) throw new Error('Manager full name is required.');
    if (!email || !email.includes('@')) throw new Error('A valid email address is required.');

    const cleanEmail = email.trim().toLowerCase();
    const invitations = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    const existingPending = invitations.find(
      (inv) => inv.email.toLowerCase() === cleanEmail && inv.status === 'pending'
    );
    if (existingPending) {
      throw new Error(`An active invitation is already pending for email "${cleanEmail}".`);
    }

    const token = `inv_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newInvitation = {
      id: `inv-${Date.now().toString(36)}`,
      inviteeName: inviteeName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      role: role || (facilityType === 'hospital' ? 'hospital_manager' : 'clinic_manager'),
      facilityId,
      facilityName,
      facilityType,
      status: 'pending',
      token,
      createdAt: new Date().toISOString(),
      expiresAt,
      simulatedLink: `https://curo.health/activate?token=${token}`,
    };

    invitations.unshift(newInvitation);
    setStored(STORAGE_KEYS.INVITATIONS, invitations);
    return newInvitation;
  },

  async resendInvitation(id) {
    try {
      const res = await adminApi.resendInvitation(id);
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    const inv = list.find((i) => i.id === id || i._id === id);
    if (!inv) throw new Error('Invitation record not found');

    inv.createdAt = new Date().toISOString();
    inv.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (inv.status === 'expired' || inv.status === 'revoked') {
      inv.status = 'pending';
    }

    setStored(STORAGE_KEYS.INVITATIONS, list);
    return inv;
  },

  async revokeInvitation(id) {
    try {
      const res = await adminApi.revokeInvitation(id);
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    const inv = list.find((i) => i.id === id || i._id === id);
    if (!inv) throw new Error('Invitation record not found');

    inv.status = 'revoked';
    setStored(STORAGE_KEYS.INVITATIONS, list);
    return inv;
  },

  async activateInvitation(id) {
    try {
      const res = await adminApi.simulateActivation(id);
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(180);
    const invitations = getStored(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    const inv = invitations.find((i) => i.id === id || i._id === id);
    if (!inv) throw new Error('Invitation record not found');
    if (inv.status !== 'pending') throw new Error(`Cannot activate an invitation with status "${inv.status}".`);

    inv.status = 'accepted';
    setStored(STORAGE_KEYS.INVITATIONS, invitations);

    const users = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    const userId = `usr-m-${Date.now().toString(36)}`;
    const newUser = {
      id: userId,
      name: inv.inviteeName,
      email: inv.email,
      role: inv.role,
      facilityType: inv.facilityType,
      facilityId: inv.facilityId,
      facilityName: inv.facilityName,
      department: inv.facilityType === 'hospital' ? 'Hospital Administration' : 'Clinic Operations',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      phone: inv.phone || '+91 98000 00000',
    };
    users.unshift(newUser);
    setStored(STORAGE_KEYS.USERS, users);

    return { invitation: inv, user: newUser };
  },

  /* -------------------------------------------------------------
     USER & ACCOUNT MANAGEMENT (SUPER ADMIN GOVERNANCE ONLY)
     Strict privacy restrictions exclude doctors and patients.
  ------------------------------------------------------------- */
  async getUsers(filters = {}) {
    try {
      const res = await adminApi.getUsers(filters);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(100);
    let list = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);

    // Strict Super Admin Privacy Restriction: exclude individual doctor and patient profiles
    list = list.filter((u) => u.role !== 'doctor' && u.role !== 'patient');

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.facilityName?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
      );
    }
    if (filters.role && filters.role !== 'all') {
      list = list.filter((u) => u.role === filters.role);
    }
    if (filters.accountStatus && filters.accountStatus !== 'all') {
      list = list.filter((u) => u.accountStatus === filters.accountStatus);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getUserById(id) {
    try {
      const user = await adminApi.getUserById(id);
      if (user) return user;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    await delay(60);
    const list = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    return list.find((u) => u.id === id || u._id === id) || null;
  },

  async updateAccountStatus(id, newStatus, reason = '') {
    try {
      const res = await adminApi.updateUserStatus(id, { status: newStatus, reason });
      notifyChange();
      return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const list = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = list.find((u) => u.id === id || u._id === id);
    if (!user) throw new Error('User not found');

    if (user.role === 'super_admin') {
      throw new Error('Platform Super Admin account cannot be suspended or deactivated.');
    }

    user.accountStatus = newStatus;
    setStored(STORAGE_KEYS.USERS, list);
    return user;
  },

  /* -------------------------------------------------------------
     REPORTS & ANALYTICS
  ------------------------------------------------------------- */
  async getAnalytics(period = 'all') {
    try {
      const res = await adminApi.getAnalytics(period);
      if (res) return res;
    } catch (err) {
      if (err.response) throw new Error(err.response.data?.message || err.message, { cause: err });
    }

    // Offline fallback
    await delay(120);
    const hospitals = getStored(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const clinics = getStored(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const users = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);

    let monthlyData = [
      { month: 'Jun 2026', hospitals: 1, clinics: 0, approvals: 1 },
      { month: 'Jul 2026', hospitals: 2, clinics: 2, approvals: 3 },
      { month: 'Aug 2026', hospitals: 5, clinics: 6, approvals: 8 },
      { month: 'Sep 2026', hospitals: 7, clinics: 8, approvals: 11 },
      { month: 'Oct 2026', hospitals: hospitals.length, clinics: clinics.length, approvals: 13 },
    ];

    if (period === '7d') {
      monthlyData = monthlyData.slice(-2);
    } else if (period === '30d') {
      monthlyData = monthlyData.slice(-3);
    }

    const allFacilities = [
      ...hospitals.map((h) => ({ ...h, type: 'hospital' })),
      ...clinics.map((c) => ({ ...c, type: 'clinic' })),
    ];

    const approvedCount = allFacilities.filter((f) => f.verificationStatus === 'approved').length;
    const pendingCount = allFacilities.filter((f) => f.verificationStatus === 'pending').length;
    const underReviewCount = allFacilities.filter((f) => f.verificationStatus === 'under_review').length;
    const needsInfoCount = allFacilities.filter((f) => f.verificationStatus === 'needs_more_information').length;
    const rejectedCount = allFacilities.filter((f) => f.verificationStatus === 'rejected').length;

    const statusDistribution = [
      { name: 'Approved', value: approvedCount, color: '#10b981' },
      { name: 'Under Review', value: underReviewCount, color: '#0284c7' },
      { name: 'Needs More Info', value: needsInfoCount, color: '#6366f1' },
      { name: 'Pending Review', value: pendingCount, color: '#f59e0b' },
      { name: 'Rejected', value: rejectedCount, color: '#f43f5e' },
    ];

    const rolesCount = {
      super_admin: users.filter((u) => u.role === 'super_admin').length,
      hospital_manager: users.filter((u) => u.role === 'hospital_manager').length,
      department_manager: users.filter((u) => u.role === 'department_manager').length,
      clinic_manager: users.filter((u) => u.role === 'clinic_manager').length,
      doctor: 84,
      patient: 1420,
    };

    const roleDistribution = [
      { role: 'Patients (Aggregate)', count: rolesCount.patient, color: '#0284c7' },
      { role: 'Doctors (Aggregate)', count: rolesCount.doctor, color: '#0f766e' },
      { role: 'Dept Managers', count: rolesCount.department_manager, color: '#8b5cf6' },
      { role: 'Clinic Managers', count: rolesCount.clinic_manager, color: '#06b6d4' },
      { role: 'Hospital Managers', count: rolesCount.hospital_manager, color: '#3b82f6' },
      { role: 'Super Admin', count: rolesCount.super_admin, color: '#ec4899' },
    ];

    const statesMap = {};
    allFacilities.forEach((f) => {
      const state = f.state || 'Other';
      statesMap[state] = (statesMap[state] || 0) + 1;
    });

    const geographicDistribution = Object.entries(statesMap).map(([state, count]) => ({
      state,
      count,
    }));

    const activeFacilities = allFacilities.filter((f) => f.accountStatus === 'active').length;
    const pendingActFacilities = allFacilities.filter((f) => f.accountStatus === 'pending_activation').length;
    const suspendedFacilities = allFacilities.filter((f) => f.accountStatus === 'suspended').length;
    const inactiveFacilities = allFacilities.filter((f) => f.accountStatus === 'inactive').length;

    return {
      monthlyData,
      statusDistribution,
      roleDistribution,
      geographicDistribution,
      totalFacilities: allFacilities.length,
      approvedRate: Math.round((approvedCount / (allFacilities.length || 1)) * 100),
      averageReviewDays: 2.4,
      activeFacilities,
      pendingActFacilities,
      suspendedFacilities,
      inactiveFacilities,
    };
  },
};

export default adminService;
