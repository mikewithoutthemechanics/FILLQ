import { Routes, Route, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Calendar,
  TrendingUp,
  Bell
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import ChurnPanel from './pages/ChurnPanel'
import SettingsPage from './pages/Settings'
import ClassBrief from './pages/ClassBrief'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">FillIQ</span>
              </div>
              
              <div className="hidden md:ml-8 md:flex md:space-x-4">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </NavLink>
                
                <NavLink
                  to="/churn"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  At-Risk Members
                </NavLink>
                
                <NavLink
                  to="/classes"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Class Briefs
                </NavLink>
                
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </NavLink>
              </div>
            </div>
            
            <div className="flex items-center">
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/churn" element={<ChurnPanel />} />
          <Route path="/classes" element={<ClassBrief />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
