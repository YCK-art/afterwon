import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'

const TopBar = ({ onGetStarted, onSettingsClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const { currentUser, logout } = useAuth()

  const navigationItems = [
    { label: 'EXPLORE', href: '#explore' },
    { label: 'PRICING', href: '#pricing' },
    { label: 'CAREER', href: '#career' }
  ]

  const handleLogout = async () => {
    try {
      await logout()
      // 로그아웃 후 처리 (예: 홈페이지로 리다이렉트)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section - Logo */}
          <div className="flex-shrink-0">
            <a href="#" className="text-white font-bold text-xl tracking-wide" style={{ fontFamily: 'Workbench, sans-serif' }}>
              Afterwon
            </a>
          </div>

          {/* Center Section - Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white font-semibold text-xs uppercase tracking-wide hover:text-gray-300 transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right Section - Profile Dropdown or Get Started Button */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{currentUser.displayName || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        onSettingsClick()
                        setIsProfileDropdownOpen(false)
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-slate-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onGetStarted}
                className="bg-white text-gray-900 px-4 py-1.5 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 text-sm"
                style={{ fontFamily: 'ProductSans, sans-serif' }}
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gray-300 focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white font-semibold text-xs uppercase tracking-wide block px-3 py-2 hover:text-gray-300 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              
              {/* Mobile Profile Options */}
              {currentUser ? (
                <>
                  <div className="border-t border-gray-700 pt-4 pb-2">
                    <button
                      onClick={() => {
                        onSettingsClick()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-3 w-full px-3 py-2 text-left text-white hover:text-gray-300 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-3 py-2 text-left text-white hover:text-gray-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-4 pb-2">
                  <button
                    onClick={() => {
                      onGetStarted()
                      setIsMenuOpen(false)
                    }}
                    className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 text-sm"
                    style={{ fontFamily: 'ProductSans, sans-serif' }}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Click outside to close profile dropdown */}
      {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </nav>
  )
}

export default TopBar 