import apiClient from './apiClient';

/**
 * CURO Platform Admin Backend API Client
 * Clean REST service layer communicating with Node.js/Express + MongoDB Atlas.
 */
export const adminApi = {
  /* =====================================================================
     1. AUTHENTICATION & SESSION
  ===================================================================== */
  async login(credentials) {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async logout() {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },

  async acceptInvitation(data) {
    const res = await apiClient.post('/auth/invitations/accept', data);
    return res.data;
  },

  /* =====================================================================
     2. DASHBOARD & ANALYTICS
  ===================================================================== */
  async getDashboardStats() {
    const res = await apiClient.get('/admin/dashboard');
    return res.data?.data;
  },

  async getAnalytics(period = '30d') {
    const res = await apiClient.get('/admin/analytics', { params: { period } });
    return res.data?.data;
  },

  /* =====================================================================
     3. APPLICATIONS WORKFLOW QUEUE
  ===================================================================== */
  async getApplications(params = {}) {
    const res = await apiClient.get('/admin/applications', { params });
    return res.data;
  },

  async getApplicationById(id, facilityType) {
    const res = await apiClient.get(`/admin/applications/${id}`, {
      params: facilityType ? { facilityType } : {},
    });
    return res.data?.data;
  },

  async reviewApplication(id, facilityType = 'hospital') {
    const res = await apiClient.patch(`/admin/applications/${id}/review`, { facilityType });
    return res.data?.data;
  },

  async approveApplication(id, { reviewNotes = '', facilityType = 'hospital', assignEmail, assignPassword } = {}) {
    const res = await apiClient.patch(`/admin/applications/${id}/approve`, {
      reviewNotes,
      facilityType,
      assignEmail,
      assignPassword,
    });
    return res.data;
  },

  async rejectApplication(id, { reason, facilityType = 'hospital' }) {
    const res = await apiClient.patch(`/admin/applications/${id}/reject`, {
      reason,
      facilityType,
    });
    return res.data?.data;
  },

  async requestMoreInfo(id, { message, facilityType = 'hospital' }) {
    const res = await apiClient.patch(`/admin/applications/${id}/request-info`, {
      message,
      facilityType,
    });
    return res.data?.data;
  },

  /* =====================================================================
     4. HOSPITALS MANAGEMENT
  ===================================================================== */
  async getHospitals(params = {}) {
    const res = await apiClient.get('/admin/hospitals', { params });
    return res.data;
  },

  async getHospitalById(id) {
    const res = await apiClient.get(`/admin/hospitals/${id}`);
    return res.data?.data;
  },

  async createHospital(data) {
    const res = await apiClient.post('/admin/hospitals', data);
    return res.data?.data;
  },

  async updateHospital(id, data) {
    const res = await apiClient.put(`/admin/hospitals/${id}`, data);
    return res.data?.data;
  },

  async updateHospitalStatus(id, { status, reason = '' }) {
    const res = await apiClient.patch(`/admin/hospitals/${id}/status`, { status, reason });
    return res.data?.data;
  },

  async deleteHospital(id) {
    const res = await apiClient.delete(`/admin/hospitals/${id}`);
    return res.data;
  },

  /* =====================================================================
     5. CLINICS MANAGEMENT
  ===================================================================== */
  async getClinics(params = {}) {
    const res = await apiClient.get('/admin/clinics', { params });
    return res.data;
  },

  async getClinicById(id) {
    const res = await apiClient.get(`/admin/clinics/${id}`);
    return res.data?.data;
  },

  async createClinic(data) {
    const res = await apiClient.post('/admin/clinics', data);
    return res.data?.data;
  },

  async updateClinic(id, data) {
    const res = await apiClient.put(`/admin/clinics/${id}`, data);
    return res.data?.data;
  },

  async updateClinicStatus(id, { status, reason = '' }) {
    const res = await apiClient.patch(`/admin/clinics/${id}/status`, { status, reason });
    return res.data?.data;
  },

  async deleteClinic(id) {
    const res = await apiClient.delete(`/admin/clinics/${id}`);
    return res.data;
  },

  /* =====================================================================
     6. MANAGER INVITATIONS
  ===================================================================== */
  async getInvitations(params = {}) {
    const res = await apiClient.get('/admin/invitations', { params });
    return res.data;
  },

  async createInvitation(data) {
    const res = await apiClient.post('/admin/invitations', data);
    return res.data?.data;
  },

  async resendInvitation(id) {
    const res = await apiClient.post(`/admin/invitations/${id}/resend`);
    return res.data?.data;
  },

  async revokeInvitation(id) {
    const res = await apiClient.post(`/admin/invitations/${id}/revoke`);
    return res.data?.data;
  },

  async simulateActivation(id) {
    const res = await apiClient.post(`/admin/invitations/${id}/simulate-activation`);
    return res.data?.data;
  },

  /* =====================================================================
     7. USER & ACCOUNT MANAGEMENT (Super Admin Governance)
  ===================================================================== */
  async getUsers(params = {}) {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  async getUserById(id) {
    const res = await apiClient.get(`/admin/users/${id}`);
    return res.data?.data;
  },

  async updateUserStatus(id, { status, reason = '' }) {
    const res = await apiClient.patch(`/admin/users/${id}/status`, { status, reason });
    return res.data?.data;
  },

  /* =====================================================================
     8. AUDIT LOGS
  ===================================================================== */
  async getAuditLogs(params = {}) {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },

  /* =====================================================================
     9. PLATFORM SETTINGS & DEMO RESET
  ===================================================================== */
  async getSettings() {
    const res = await apiClient.get('/admin/settings');
    return res.data?.data;
  },

  async updateSettings(data) {
    const res = await apiClient.put('/admin/settings', data);
    return res.data?.data;
  },

  async resetDemoData() {
    const res = await apiClient.post('/admin/settings/reset');
    return res.data;
  },
};

export default adminApi;
