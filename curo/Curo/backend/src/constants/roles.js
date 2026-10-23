/**
 * User roles defined across the healthcare system
 */
export const ROLES = Object.freeze({
  PATIENT: 'patient',
  CLINIC: 'clinic',
  HOSPITAL_OWNER: 'hospital_owner',
  HOSPITAL_ADMIN: 'hospital_admin',
  MANAGER: 'manager',
  DOCTOR: 'doctor',
});

export const ROLE_LIST = Object.values(ROLES);
