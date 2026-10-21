import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import { Shield, Lock, Mail, AlertCircle, ArrowRight, User, Stethoscope } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.login({ email, password })
      if (res.success && res.token) {
        login(res.token, res.user)
        if (res.user.role === 'patient') {
          navigate(from === '/' ? '/patient' : from)
        } else if (res.user.role === 'doctor') {
          navigate(from === '/' ? '/doctor' : from)
        } else {
          navigate(from)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.demoLogin(role)
      if (res.success && res.token) {
        login(res.token, res.user)
        navigate(role === 'doctor' ? '/doctor' : '/patient')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Sign In to MediChain
          </h1>
          <p className="text-xs text-[#4a5568] mt-1">
            Access your personal health records or doctor portal
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#00205b] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-[#d1dbe5] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#00205b] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#d1dbe5] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mayo-btn-primary py-2.5 mt-2 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing in…' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Instant Demo Options */}
        <div className="mt-6 pt-5 border-t border-[#e2e8f0] space-y-2.5">
          <div className="text-center">
            <span className="text-[11px] font-bold text-[#003087] uppercase tracking-wider">
              Instant 1-Click Demo
            </span>
            <p className="text-[11px] text-[#4a5568]">
              Test all features immediately without typing credentials
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('patient')}
              className="py-2.5 px-3 bg-[#eef4fa] hover:bg-[#dbeafe] border border-[#bfdbfe] rounded-lg text-[#003087] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Demo as Patient</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('doctor')}
              className="py-2.5 px-3 bg-[#eef4fa] hover:bg-[#dbeafe] border border-[#bfdbfe] rounded-lg text-[#003087] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Demo as Doctor</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#e2e8f0] text-center text-xs text-[#4a5568]">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="text-[#003087] font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}
