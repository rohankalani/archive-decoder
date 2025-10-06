import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { UnifiedMockDataProvider } from '@/contexts/UnifiedMockDataContext'
import { Toaster } from '@/components/ui/sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { InlineLoader } from '@/components/LoadingSpinner'
import Auth from '@/pages/Auth'
import { BuildingView } from '@/pages/BuildingView'
import { DeviceView } from '@/pages/DeviceView'
import { DeviceDetail } from '@/pages/DeviceDetail'
import Management from '@/pages/Management'
import { Settings } from '@/pages/Settings'
import Reports from '@/pages/Reports'
import Alerts from '@/pages/Alerts'
import UserManagement from '@/pages/UserManagement'
import DatabaseChat from '@/pages/DatabaseChat'
import { GeneralReportsSimple } from '@/pages/GeneralReportsSimple'

// Lazy load report pages
const SummaryReport = lazy(() => import('@/pages/reports/SummaryReport'))
const BuildingsReport = lazy(() => import('@/pages/reports/BuildingsReport'))
const ClassroomsReport = lazy(() => import('@/pages/reports/ClassroomsReport'))
const AnalysisReport = lazy(() => import('@/pages/reports/AnalysisReport'))

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <UnifiedMockDataProvider>
          <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={<Navigate to="/devices" replace />}
            />
            <Route
              path="/buildings"
              element={
                <ProtectedRoute>
                  <BuildingView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <DeviceView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/device/:deviceId"
              element={
                <ProtectedRoute>
                  <DeviceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management"
              element={
                <ProtectedRoute requireAdmin>
                  <Management />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/summary"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<InlineLoader text="Loading summary report..." />}>
                    <SummaryReport />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/buildings"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<InlineLoader text="Loading buildings report..." />}>
                    <BuildingsReport />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/classrooms"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<InlineLoader text="Loading classrooms report..." />}>
                    <ClassroomsReport />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/analysis"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<InlineLoader text="Loading analysis report..." />}>
                    <AnalysisReport />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/general"
              element={
                <ProtectedRoute>
                  <GeneralReportsSimple />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/advanced"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/database-chat"
              element={
                <ProtectedRoute>
                  <DatabaseChat />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </div>
          </Router>
        </UnifiedMockDataProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App