import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Shield,
  Search,
  Lock,
  Menu,
  X,
  User,
  HeartPulse,
  LogOut,
  Upload,
  UserCheck,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import WalletButton from './WalletButton.jsx'

export default function Layout() {
  const { user, isAuthenticated, logout, isPatient, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (searchQuery.trim().startsWith('0x') && searchQuery.trim().length === 66) {
        navigate(`/records/${searchQuery.trim()}`)
      } else {
        navigate(`/records?search=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fa] text-[#1a202c]">
      {/* ── TOP UTILITY BAR ──────────────────────────────────────────────── */}
      <div className="bg-[#00205b] text-white text-xs py-2 px-4 sm:px-8 border-b border-[#001740]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">MediChain Healthcare Portal</span>
            <span className="hidden md:inline text-blue-300">•</span>
            <span className="hidden md:inline text-blue-200">Safe, Private & Patient-Controlled Medical Records</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Wallet Connection Button */}
            <WalletButton />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-blue-800 pl-3">
                <span className="text-blue-200 hidden sm:inline capitalize">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-red-300 hover:text-white flex items-center gap-1 font-medium transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-blue-800 pl-3">
                <Link to="/login" className="hover:text-blue-200 font-medium">
                  Sign In
                </Link>
                <span className="text-blue-300">/</span>
                <Link to="/register" className="hover:text-blue-200 font-medium">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER (Brand Logo + Search + Action Button) ─────────────── */}
      <header className="bg-white border-b border-[#d1dbe5] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Healthcare Branding */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link
              to={isAuthenticated ? (isDoctor ? '/doctor' : '/patient') : '/'}
              className="flex items-center gap-3 group"
            >
              {/* Shield Crest Icon */}
              <div className="flex items-center -space-x-1">
                <div className="w-9 h-11 bg-[#00205b] rounded-b-xl flex items-center justify-center text-white shadow-sm group-hover:bg-[#003087] transition-colors">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-12 bg-[#003087] rounded-b-xl flex items-center justify-center text-white shadow-md z-10">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="w-9 h-11 bg-[#00205b] rounded-b-xl flex items-center justify-center text-white shadow-sm group-hover:bg-[#003087] transition-colors">
                  <Lock className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
                    MEDICHAIN
                  </span>
                </div>
                <p className="text-xs text-[#4a5568] tracking-wider uppercase font-semibold">
                  Secure Patient Health Portal
                </p>
              </div>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#003087] hover:bg-[#eef4fa] rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Central Search Bar (Shown when authenticated) */}
          {isAuthenticated ? (
            <div className="w-full lg:max-w-xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medical records by title or record number…"
                  className="mayo-input pr-28 text-xs sm:text-sm pl-5 py-3 shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 bg-[#003087] hover:bg-[#00205b] text-white px-5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#4a5568]">
              <Lock className="w-4 h-4 text-[#003087]" />
              <span>Sign in to access your encrypted records and doctor consultations.</span>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              isPatient ? (
                <Link to="/upload" className="mayo-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Record</span>
                </Link>
              ) : (
                <Link to="/doctor" className="mayo-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Doctor Portal</span>
                </Link>
              )
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="mayo-btn-outline text-xs px-4 py-2 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="mayo-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5">
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN NAVIGATION BAR ─────────────────────────────────────────── */}
      <nav className="bg-[#003087] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="hidden lg:flex items-center space-x-1">
            
            {/* Show Home ONLY when NOT logged in */}
            {!isAuthenticated && (
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                    isActive
                      ? 'border-white bg-[#00205b] text-white'
                      : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
            )}

            {/* Patient navigation links (No Home link) */}
            {isAuthenticated && isPatient && (
              <>
                <NavLink
                  to="/patient"
                  className={({ isActive }) =>
                    `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                      isActive
                        ? 'border-white bg-[#00205b] text-white'
                        : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                    }`
                  }
                >
                  My Records
                </NavLink>

                <NavLink
                  to="/upload"
                  className={({ isActive }) =>
                    `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                      isActive
                        ? 'border-white bg-[#00205b] text-white'
                        : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                    }`
                  }
                >
                  Upload Document
                </NavLink>

                <NavLink
                  to="/access"
                  className={({ isActive }) =>
                    `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                      isActive
                        ? 'border-white bg-[#00205b] text-white'
                        : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                    }`
                  }
                >
                  Doctor Access
                </NavLink>
              </>
            )}

            {/* Doctor navigation links (No Home link) */}
            {isAuthenticated && isDoctor && (
              <NavLink
                to="/doctor"
                className={({ isActive }) =>
                  `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                    isActive
                      ? 'border-white bg-[#00205b] text-white'
                      : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                  }`
                }
              >
                Doctor Portal
              </NavLink>
            )}

            {/* Activity History and All Records — SHOWN ONLY WHEN LOGGED IN */}
            {isAuthenticated && (
              <>
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                      isActive
                        ? 'border-white bg-[#00205b] text-white'
                        : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                    }`
                  }
                >
                  Activity History
                </NavLink>

                <NavLink
                  to="/records"
                  className={({ isActive }) =>
                    `px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-4 ${
                      isActive
                        ? 'border-white bg-[#00205b] text-white'
                        : 'border-transparent text-blue-100 hover:bg-[#002875] hover:text-white'
                    }`
                  }
                >
                  All Records
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 space-y-1 border-t border-blue-800 text-sm">
              {!isAuthenticated && (
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                >
                  Home
                </NavLink>
              )}

              {isAuthenticated && isPatient && (
                <>
                  <NavLink
                    to="/patient"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                  >
                    My Records
                  </NavLink>
                  <NavLink
                    to="/upload"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                  >
                    Upload Document
                  </NavLink>
                  <NavLink
                    to="/access"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                  >
                    Doctor Access
                  </NavLink>
                </>
              )}

              {isAuthenticated && isDoctor && (
                <NavLink
                  to="/doctor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                >
                  Doctor Portal
                </NavLink>
              )}

              {/* Only show Activity History and All Records on mobile when logged in */}
              {isAuthenticated && (
                <>
                  <NavLink
                    to="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                  >
                    Activity History
                  </NavLink>
                  <NavLink
                    to="/records"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 font-medium hover:bg-[#00205b] rounded"
                  >
                    All Records
                  </NavLink>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── BREADCRUMB STRIP (No 'Home' link when on individual portal) ───── */}
      <div className="bg-[#eef4fa] border-b border-[#d1dbe5] py-2 px-4 sm:px-8 text-xs text-[#4a5568]">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {isAuthenticated ? (
            <span className="text-[#00205b] font-semibold">
              {isDoctor ? 'Doctor Consultation Portal' : 'Patient Health Portal'} — {user.name}
            </span>
          ) : (
            <span className="text-[#00205b] font-semibold">
              Welcome to MediChain
            </span>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#00205b] text-white mt-16 pt-12 pb-8 border-t-4 border-[#003087]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-blue-900/60">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-300" />
                <h4 className="font-bold text-base tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  MediChain
                </h4>
              </div>
              <p className="text-xs text-blue-200 leading-relaxed">
                A simple, secure way to store your medical records and share them safely with trusted doctors. Your privacy is always under your control.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3 text-white uppercase tracking-wider">
                {isAuthenticated ? 'Portal Navigation' : 'Get Started'}
              </h4>
              <ul className="text-xs space-y-2 text-blue-200">
                {isAuthenticated ? (
                  isPatient ? (
                    <>
                      <li><Link to="/patient" className="hover:text-white">My Records</Link></li>
                      <li><Link to="/upload" className="hover:text-white">Upload Document</Link></li>
                      <li><Link to="/access" className="hover:text-white">Manage Doctor Access</Link></li>
                      <li><Link to="/history" className="hover:text-white">Activity History</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link to="/doctor" className="hover:text-white">Doctor Portal</Link></li>
                      <li><Link to="/history" className="hover:text-white">Activity History</Link></li>
                      <li><Link to="/records" className="hover:text-white">All Records</Link></li>
                    </>
                  )
                ) : (
                  <>
                    <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
                    <li><Link to="/register" className="hover:text-white">Create Account</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3 text-white uppercase tracking-wider">
                Patient Privacy
              </h4>
              <ul className="text-xs space-y-2 text-blue-200">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Files are always encrypted</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Only your doctor can view files</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Cancel doctor access anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Protected against alteration</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3 text-white uppercase tracking-wider">
                Need Help?
              </h4>
              <p className="text-xs text-blue-200 leading-relaxed mb-3">
                To upload documents or share records, connect your secure digital wallet using the button at the top of the page.
              </p>
              <div className="bg-[#002875] p-3 rounded-lg text-xs text-blue-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <span>Your medical files are never shared without your permission.</span>
              </div>
            </div>
          </div>

          <div className="pt-6 text-xs text-blue-300 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>
              © 2026 MediChain Healthcare System. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">Patient Rights</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">Security Safeguards</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
