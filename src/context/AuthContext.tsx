import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, UserSession } from '../types';

interface AuthContextType {
  currentUser: UserSession;
  setRole: (role: UserRole) => void;
  canManageRoads: boolean;
  canVerifyIssues: boolean;
  canAssignContractor: boolean;
  canUpdateRepairStatus: boolean;
  canAccessAdmin: boolean;
  canManageContractors: boolean;
}

const DEFAULT_USERS: Record<UserRole, UserSession> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    name: 'S. K. Mehta (Chief Engineer)',
    email: 'chief.engineer@mcgm.gov.in',
    department: 'Municipal Corporation Greater Mumbai - Roads Dept',
  },
  ADMIN: {
    role: 'ADMIN',
    name: 'A. Rao (Executive Engineer)',
    email: 'admin.roads@mcgm.gov.in',
    department: 'Central Infrastructure Monitoring Cell',
  },
  INSPECTOR: {
    role: 'INSPECTOR',
    name: 'D. Shinde (Junior Engineer / Field Inspector)',
    email: 'inspector.shinde@mcgm.gov.in',
    department: 'Zone 1 Vigilance Squad',
  },
  CONTRACTOR: {
    role: 'CONTRACTOR',
    name: 'Rajesh Kulkarni (Site Lead)',
    email: 'rajesh.k@bmcroads.gov.in',
    contractorId: 'C-101',
    department: 'BMC Central Highway Works Ltd',
  },
  CITIZEN: {
    role: 'CITIZEN',
    name: 'Citizen (Public User)',
    email: 'citizen@mumbairoads.org',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('muniroad_current_role_v1');
      if (saved && DEFAULT_USERS[saved as UserRole]) {
        return DEFAULT_USERS[saved as UserRole];
      }
    } catch {}
    return DEFAULT_USERS.CITIZEN;
  });

  const setRole = (role: UserRole) => {
    const user = DEFAULT_USERS[role] || DEFAULT_USERS.CITIZEN;
    setCurrentUser(user);
    try {
      localStorage.setItem('muniroad_current_role_v1', role);
    } catch {}
  };

  const isSuper = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuper;
  const isInspector = currentUser.role === 'INSPECTOR' || isAdmin;
  const isContractor = currentUser.role === 'CONTRACTOR' || isAdmin;

  const value: AuthContextType = {
    currentUser,
    setRole,
    canAccessAdmin: currentUser.role !== 'CITIZEN',
    canManageRoads: isAdmin,
    canVerifyIssues: isInspector,
    canAssignContractor: isAdmin,
    canUpdateRepairStatus: isContractor,
    canManageContractors: isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
