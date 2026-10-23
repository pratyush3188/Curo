import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClinicProfile, ClinicUser, Doctor } from '../types';
import { ClinicService } from '../services/clinicService';
import { MOCK_CLINIC_USERS } from '../mock/mockData';

interface ClinicContextType {
  currentClinic: ClinicProfile | null;
  currentUser: ClinicUser;
  allClinics: ClinicProfile[];
  availableUsers: ClinicUser[];
  userRole: ClinicUser['role'];
  // Active doctor profile if logged in or selected as doctor
  activeDoctor: Doctor | null;
  isAuthenticated: boolean;
  loginClinic: (clinicId: string, passcode: string) => boolean;
  logoutClinic: () => void;
  // Role switcher dropdown (Doctor vs Receptionist)
  selectActiveUser: (userId: string) => void;
  switchUserRole: (role: ClinicUser['role']) => void;
  reloadClinicData: () => void;
  hasAccessToSensitiveMedicalRecords: boolean;
  isReceptionist: boolean;
  isDoctor: boolean;
  tenantAccessError: string | null;
  clearTenantError: () => void;
  validateRecordAccess: (recordClinicId: string) => boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'curo_clinic_auth_session';

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allClinics, setAllClinics] = useState<ClinicProfile[]>([]);
  const [currentClinicId, setCurrentClinicId] = useState<string>('clinic-curo-care');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });
  
  // Available users
  const [currentUser, setCurrentUser] = useState<ClinicUser>(MOCK_CLINIC_USERS[0]);
  const [userRole, setUserRole] = useState<ClinicUser['role']>(MOCK_CLINIC_USERS[0].role);
  const [tenantAccessError, setTenantAccessError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const clinics = ClinicService.getAllClinics();
    setAllClinics(clinics);
    const active = clinics.find((c) => c.id === currentClinicId) || clinics[0];
    if (active) {
      setCurrentClinicId(active.id);
    }
  }, [refreshTrigger]);

  const currentClinic = ClinicService.getClinicById(currentClinicId);
  const clinicUsers = MOCK_CLINIC_USERS.filter((u) => u.clinicId === currentClinicId);
  const doctors = currentClinic ? ClinicService.getDoctors(currentClinic.id) : [];

  // Active doctor if user is a doctor
  const activeDoctor =
    currentUser.role === 'Authorized Doctor'
      ? doctors.find(
          (d) =>
            d.fullName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim() ||
            d.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase()) ||
            currentUser.fullName.toLowerCase().includes(d.fullName.toLowerCase())
        ) || null
      : null;

  const reloadClinicData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const loginClinic = (clinicId: string, passcode: string): boolean => {
    // Unique ID: clinic-curo-care or curo-care or curo
    // Passcode: curo2026 or admin123
    const validId = clinicId.trim().toLowerCase();
    const validPass = passcode.trim();

    if (
      (validId === 'clinic-curo-care' || validId === 'curo' || validId === 'curo-care' || validId === 'curo101') &&
      (validPass === 'curo2026' || validPass === 'admin123' || validPass === 'clinic123')
    ) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setCurrentClinicId('clinic-curo-care');
      setCurrentUser(MOCK_CLINIC_USERS[0]);
      setUserRole(MOCK_CLINIC_USERS[0].role);
      setTenantAccessError(null);
      return true;
    }
    return false;
  };

  const logoutClinic = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const selectActiveUser = (userId: string) => {
    const found = MOCK_CLINIC_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setUserRole(found.role);
    }
  };

  const switchUserRole = (newRole: ClinicUser['role']) => {
    setUserRole(newRole);
    const matched = clinicUsers.find((u) => u.role === newRole);
    if (matched) {
      setCurrentUser(matched);
    } else {
      setCurrentUser({
        ...currentUser,
        role: newRole,
        fullName: newRole === 'Authorized Doctor' ? 'Dr. Rajesh Sharma' : 'Sunita Deshmukh'
      });
    }
  };

  // Permissions
  const isReceptionist = userRole === 'Reception Staff' || userRole === 'Clinic Manager';
  const isDoctor = userRole === 'Authorized Doctor';
  const hasAccessToSensitiveMedicalRecords = true; // Authorized staff in clinic portal

  const validateRecordAccess = (recordClinicId: string): boolean => {
    if (recordClinicId !== currentClinicId) {
      setTenantAccessError(
        `TENANT ISOLATION ALERT: Record clinic ID [${recordClinicId}] does not match current clinic [${currentClinicId}].`
      );
      return false;
    }
    return true;
  };

  const clearTenantError = () => {
    setTenantAccessError(null);
  };

  return (
    <ClinicContext.Provider
      value={{
        currentClinic,
        currentUser,
        allClinics,
        availableUsers: clinicUsers,
        userRole,
        activeDoctor,
        isAuthenticated,
        loginClinic,
        logoutClinic,
        selectActiveUser,
        switchUserRole,
        reloadClinicData,
        hasAccessToSensitiveMedicalRecords,
        isReceptionist,
        isDoctor,
        tenantAccessError,
        clearTenantError,
        validateRecordAccess
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
