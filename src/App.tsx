/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { RoadDetailPage } from './pages/RoadDetailPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { TrackReportPage } from './pages/TrackReportPage';
import { MaintenanceHistoryPage } from './pages/MaintenanceHistoryPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';
import { LoginPage } from './pages/LoginPage';

// Admin Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRoadsPage } from './pages/admin/AdminRoadsPage';
import { AdminIssuesPage } from './pages/admin/AdminIssuesPage';
import { AdminMaintenancePage } from './pages/admin/AdminMaintenancePage';
import { AdminContractorsPage } from './pages/admin/AdminContractorsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminMapPage } from './pages/admin/AdminMapPage';

// Public Layout
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Citizen Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/road/:roadId" element={<RoadDetailPage />} />
            <Route path="/road/:roadId/report" element={<ReportIssuePage />} />
            <Route path="/report/:issueId" element={<TrackReportPage />} />
            <Route path="/history/:roadId" element={<MaintenanceHistoryPage />} />
            <Route path="/reports" element={<CitizenReportsPage />} />
            <Route path="/my-reports" element={<CitizenReportsPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Admin Routes with Sidebar */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="roads" element={<AdminRoadsPage />} />
            <Route path="issues" element={<AdminIssuesPage />} />
            <Route path="maintenance" element={<AdminMaintenancePage />} />
            <Route path="contractors" element={<AdminContractorsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="map" element={<AdminMapPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<PublicLayout />}>
            <Route path="*" element={<LandingPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
