import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWeb3 } from '../context/Web3Context.jsx'
import { api } from '../services/api.js'
import { Shield, Lock, Mail, User, Wallet, AlertCircle, ArrowRight, Stethoscope } from 'lucide-react'

export default function Register() {
  const [role, setRole] = useState('patient')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const { account, connectWallet } = useWeb3()
  const navigate = useNavigate()

  // Auto-fill wallet address if wallet is connected
  useEffect(() => {
    if (account && !walletAddress) {
      setWalletAddress(account)
    }
  }, [account, walletAddress])

  const handleUseConnectedWallet = async () => {
    if (account) {
      setWalletAddress(account)
    } else {
      const connected = await connectWallet()
      if (connected) setWalletAddress(connected)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      setError('Please provide a valid account address (starting with 0x...).')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        walletAddress: walletAddress.trim().toLowerCase(),
        specialization: role === 'doctor' ? specialization : '',
        licenseNumber: role === 'doctor' ? licenseNumber : '',
      }

      const res = await api.register(payload)
      if (res.success && res.token) {
        login(res.token, res.user)
        navigate(role === 'doctor' ? '/doctor' : '/patient')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-6">
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Create Your MediChain Account
          </h1>
          <p className="text-xs text-[#4a5568] mt-1">
            Choose whether you are a patient or a doctor to get started
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selection toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#00205b] mb-2">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  role === 'patient'
                    ? 'border-[#003087] bg-[#eef4fa] text-[#00205b] font-bold shadow-sm'
                    : 'border-[#d1dbe5] bg-white text-[#4a5568] hover:border-[#a0aec0]'
                }`}
              >
                <User className="w-5 h-5 text-[#003087]" />
                <div>
                  <div className="text-sm">Patient</div>
                  <div className="text-[11px] font-normal text-[#4a5568]">Store & control your records</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  role === 'doctor'
                    ? 'border-[#003087] bg-[#eef4fa] text-[#00205b] font-bold shadow-sm'
                    : 'border-[#d1dbe5] bg-white text-[#4a5568] hover:border-[#a0aec0]'
                }`}
              >
                <Stethoscope className="w-5 h-5 text-[#003087]" />
                <div>
                  <div className="text-sm">Doctor</div>
                  <div className="text-[11px] font-normal text-[#4a5568]">Review shared records</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#00205b] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'doctor' ? 'Dr. Sarah Connor' : 'Jane Doe'}
                className="w-full bg-white border border-[#d1dbe5] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#00205b] mb-1">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#d1dbe5] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            </div>
          </div>

          {/* Digital Wallet Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#00205b]">
                Digital Wallet Address
              </label>
              <button
                type="button"
                onClick={handleUseConnectedWallet}
                className="text-[11px] text-[#003087] font-semibold hover:underline"
              >
                {account ? 'Use Connected Wallet' : 'Connect Wallet'}
              </button>
            </div>
            <div className="relative">
              <Wallet className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white border border-[#d1dbe5] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-[#4a5568] mt-1">
              This address connects your account so you can verify and protect your records.
            </p>
          </div>

          {/* Doctor specific fields */}
          {role === 'doctor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#00205b] mb-1">
                  Medical Specialty
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Cardiology, General Medicine"
                  className="w-full bg-white border border-[#d1dbe5] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#00205b] mb-1">
                  Doctor License #
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. MED-88219"
                  className="w-full bg-white border border-[#d1dbe5] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mayo-btn-primary py-2.5 mt-4 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Creating Account…' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#e2e8f0] text-center text-xs text-[#4a5568]">
          <span>Already have an account? </span>
          <Link to="/login" className="text-[#003087] font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  )
}
