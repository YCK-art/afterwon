import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const SettingsPage = () => {
  const { currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('settings')
  const [workspaceName, setWorkspaceName] = useState('Youngchan')
  const [defaultGenerationName, setDefaultGenerationName] = useState('e.g. "$Prompt image - $Date"')

  const tabs = [
    { id: 'settings', label: 'Settings' },
    { id: 'members', label: 'Members' },
    { id: 'plans', label: 'Plans & Billing' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header Section - 상단 여백 증가 */}
        <div className="mt-16 mb-12">
          <div className="flex items-start space-x-5">
            {/* Profile Image - 크기 축소 */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                <img 
                  src="/images/homepage/background.png" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* User Info and Tabs */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-5" style={{ fontFamily: 'Doto, sans-serif' }}>
                {currentUser?.displayName || 'Youngchan'}
              </h1>
              
              {/* Tab Navigation - 크기 축소 */}
              <div className="flex space-x-6 border-b border-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'text-slate-900 border-b-2 border-slate-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Workspace Logo */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Workspace logo</h2>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Workspace Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="bg-slate-700 text-white px-3 py-1.5 rounded-md hover:bg-slate-600 transition-colors text-sm">
                  Upload logo
                </button>
              </div>
              <p className="text-xs text-slate-500">Min. 200x200px, .PNG or .JPG</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200"></div>

            {/* Workspace Name */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Workspace name</h2>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full max-w-sm bg-slate-100 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                placeholder="Enter workspace name"
              />
              <div className="flex space-x-2">
                <button className="bg-slate-200 text-slate-700 px-4 py-1.5 rounded-md hover:bg-slate-300 transition-colors text-sm">
                  Cancel
                </button>
                <button className="bg-slate-700 text-white px-4 py-1.5 rounded-md hover:bg-slate-600 transition-colors text-sm">
                  Confirm
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200"></div>

            {/* Default Generation Name */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Default generation name</h2>
              <input
                type="text"
                value={defaultGenerationName}
                onChange={(e) => setDefaultGenerationName(e.target.value)}
                className="w-full max-w-sm bg-slate-100 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                placeholder="Enter default generation name"
              />
              <div>
                <button className="bg-slate-700 text-white px-4 py-1.5 rounded-md hover:bg-slate-600 transition-colors text-sm">
                  Clear
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200"></div>

            {/* Theme Mode Toggle */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Theme</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="light-mode"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => toggleTheme('light')}
                    className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                  />
                  <label htmlFor="light-mode" className="text-sm text-slate-700 cursor-pointer">
                    Light mode
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dark-mode"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => toggleTheme('dark')}
                    className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                  />
                  <label htmlFor="dark-mode" className="text-sm text-slate-700 cursor-pointer">
                    Dark mode
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-500">Choose your preferred theme for the application</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200"></div>

            {/* Delete Workspace */}
            <div className="space-y-3">
              <button className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition-colors text-sm">
                Delete workspace
              </button>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
            <p className="text-sm text-slate-600">Members management coming soon...</p>
          </div>
        )}

        {/* Plans & Billing Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Plans & Billing</h2>
            <p className="text-sm text-slate-600">Billing information coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage 