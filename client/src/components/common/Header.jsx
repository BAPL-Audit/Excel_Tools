import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Header = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Audit Tools</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActivePath('/dashboard') ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/tools"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActivePath('/tools') ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                Tools
              </Link>
              <Link
                to="/projects"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActivePath('/projects') ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                Projects
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActivePath('/admin') ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:block">
                  <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block">{user.name}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActivePath('/dashboard') ? 'text-blue-600' : 'text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/tools"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActivePath('/tools') ? 'text-blue-600' : 'text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tools
              </Link>
              <Link
                to="/projects"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActivePath('/projects') ? 'text-blue-600' : 'text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Projects
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActivePath('/admin') ? 'text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/profile"
                className="text-sm font-medium transition-colors hover:text-blue-600 text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 text-left"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header