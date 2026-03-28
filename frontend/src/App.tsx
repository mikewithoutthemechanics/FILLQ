import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Settings,
  Calendar,
  TrendingUp,
  Bell,
  LogOut
} from 'lucide-react'
import { useAuth } from './hooks/useSupabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import ChurnPanel from './pages/ChurnPanel'
import SettingsPage from './pages/Settings'
import ClassBrief from './pages/ClassBrief'

const C = {
  g: { 900: '#1B3A0A', 800: '#2D5016', 700: '#3D6B22', 600: '#4A7C28', 400: '#8BAA6B', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  t: { 900: '#0F0F0F', 700: '#2D2D2D', 500: '#6B6B6B', 400: '#8A8A8A', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}
const font = { display: "'DM Serif Display', serif", body: "'DM Sans', sans-serif" }

function isOnboarded() {
  return localStorage.getItem('filliq_onboarded') === 'true'
}

function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.w }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.g[800] }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: C.g[200], borderTopColor: C.g[800] }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireOnboarding && !isOnboarded()) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const studioName = localStorage.getItem('filliq_studio_name') || 'Studio'

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.w }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: 'rgba(250,250,248,0.92)', borderColor: C.b }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.g[800] }}>
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold" style={{ fontFamily: font.display, color: C.t[900] }}>FillIQ</span>
              </div>

              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {[
                  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
                  { to: '/classes', icon: Calendar, label: 'Classes' },
                  { to: '/churn', icon: Users, label: 'At-Risk' },
                  { to: '/settings', icon: Settings, label: 'Settings' },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? C.g[50] : 'transparent',
                      color: isActive ? C.g[800] : C.t[500],
                      fontFamily: font.body,
                    })}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] hidden sm:block" style={{ color: C.t[400], fontFamily: font.body }}>{studioName}</span>
              <button className="p-2 rounded-lg transition-colors relative"
                style={{ color: C.t[400] }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: C.g[600] }} />
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-lg transition-colors"
                style={{ color: C.t[400] }}
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute requireOnboarding={false}>
          <Onboarding />
        </ProtectedRoute>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/churn" element={
        <ProtectedRoute>
          <AppLayout><ChurnPanel /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/classes" element={
        <ProtectedRoute>
          <AppLayout><ClassBrief /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout><SettingsPage /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  )
}

export default App
