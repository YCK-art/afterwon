import { useState } from 'react'

const TopBar = ({ onGetStarted }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    { label: 'EXPLORE', href: '#explore' },
    { label: 'PRICING', href: '#pricing' },
    { label: 'CAREER', href: '#career' }
  ]

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

          {/* Right Section - Get Started Button */}
          <div className="flex items-center">
            <button
              onClick={onGetStarted}
              className="bg-white text-gray-900 px-4 py-1.5 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 text-sm"
              style={{ fontFamily: 'ProductSans, sans-serif' }}
            >
              Get Started
            </button>
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
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default TopBar 