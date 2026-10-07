import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../common/Header';

export const AdminLayout: React.FC = () => {
  const { currentUser, canAccessAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
