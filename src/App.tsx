/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BusinessTargetsProvider } from './contexts/BusinessTargetsContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NorthStarPage } from './pages/NorthStarPage';
import { TargetHierarchyPage } from './pages/TargetHierarchyPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { HabitTrackerPage } from './pages/HabitTrackerPage';
import { SecondBrainPage } from './pages/SecondBrainPage';
import { MonthlyReviewPage } from './pages/MonthlyReviewPage';
import { AiPromptGeneratorPage } from './pages/AiPromptGeneratorPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d19] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Memverifikasi sesi Life OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessTargetsProvider>
          <Routes>
            {/* Public login route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Life OS Funnel application routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="north-star" element={<NorthStarPage />} />
              <Route path="target-hierarchy" element={<TargetHierarchyPage />} />
              <Route path="execution" element={<ExecutionPage />} />
              <Route path="habit-tracker" element={<HabitTrackerPage />} />
              <Route path="second-brain" element={<SecondBrainPage />} />
              <Route path="monthly-review" element={<MonthlyReviewPage />} />
              <Route path="ai-prompt" element={<AiPromptGeneratorPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BusinessTargetsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
