/**
 * User roles defined across the healthcare system
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  HOSPITAL_OWNER: 'hospital_owner',
  HOSPITAL_MANAGER: 'hospital_manager',
  DEPARTMENT_MANAGER: 'department_manager',
  CLINIC_MANAGER: 'clinic_manager',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  // Legacy aliases for backward compatibility
  HOSPITAL_ADMIN: 'hospital_admin',
  MANAGER: 'manager',
  CLINIC: 'clinic',
});

export const ROLE_LIST = Object.values(ROLES);

// Roles accessible by the Super Admin governance panel (Privacy Partitioned)
export const GOVERNANCE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HOSPITAL_OWNER,
  ROLES.HOSPITAL_MANAGER,
  ROLES.DEPARTMENT_MANAGER,
  ROLES.CLINIC_MANAGER,
  ROLES.HOSPITAL_ADMIN,
  ROLES.MANAGER,
];
