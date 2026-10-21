import { useEffect, useState } from 'react'
import {
  FileText,
  Shield,
  CheckCircle,
  ArrowRight,
  Lock,
  UserCheck,
  Upload,
  User,
  Stethoscope
} from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { isAuthenticated, isPatient, isDoctor } = useAuth()
  const [apiOnline, setApiOnline] = useState(true)

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    fetch(`${base}/health`)
      .then(res => res.json())
      .then(data => {
        setApiOnline(data.success === true)
      })
      .catch(() => {
        setApiOnline(false)
      })
  }, [])

  // When logged in as Patient or Doctor, automatically redirect to their individual portal
  if (isAuthenticated) {
    return <Navigate to={isDoctor ? '/doctor' : '/patient'} replace />
  }

  return (
    <div className="space-y-10">
      
      {/* ── WELCOME HERO CALLOUT BANNER ───────────────────────────────────── */}
      <section className="bg-white border-l-4 border-[#003087] border-y border-r border-[#d1dbe5] rounded-r-xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#003087] uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4 text-[#003087]" />
            <span>Safe & Private Health Records</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#00205b] tracking-tight leading-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Take Control of Your Medical Records
          </h1>
          <p className="text-base text-[#4a5568] leading-relaxed mb-6">
            MediChain keeps your medical reports and prescriptions safe, organized, and private.
            Your files are fully protected so they cannot be altered or lost, and only doctors you approve can view them.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="mayo-btn-primary"
            >
              <User className="w-4 h-4" />
              <span>Sign In to Portal</span>
            </Link>

            <Link
              to="/register"
              className="mayo-btn-outline"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4-CARD QUICK ACTION TILES ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Healthcare Services
          </h2>
          <span className="text-xs text-[#4a5568]">Choose a portal to sign in</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Tile 1: Patient Portal */}
          <Link
            to="/login"
            className="mayo-tile group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#eef4fa] text-[#003087] flex items-center justify-center mb-4 group-hover:bg-[#003087] group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-1 group-hover:text-[#003087] flex items-center justify-between">
              Patient Portal
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Safely store, organize, and access your health reports and prescriptions anytime.
            </p>
          </Link>

          {/* Tile 2: Doctor Portal */}
          <Link
            to="/login"
            className="mayo-tile group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#eef4fa] text-[#003087] flex items-center justify-center mb-4 group-hover:bg-[#003087] group-hover:text-white transition-colors">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-1 group-hover:text-[#003087] flex items-center justify-between">
              Doctor Portal
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Consult with patients and review authorized medical documentation securely.
            </p>
          </Link>

          {/* Tile 3: Bank-Grade Privacy */}
          <Link
            to="/register"
            className="mayo-tile group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#eef4fa] text-[#003087] flex items-center justify-center mb-4 group-hover:bg-[#003087] group-hover:text-white transition-colors">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-1 group-hover:text-[#003087] flex items-center justify-between">
              Bank-Grade Privacy
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Every document is privately encrypted. Only doctors you approve can view your files.
            </p>
          </Link>

          {/* Tile 4: Tamper-Proof Protection */}
          <Link
            to="/login"
            className="mayo-tile group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#eef4fa] text-[#003087] flex items-center justify-center mb-4 group-hover:bg-[#003087] group-hover:text-white transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-1 group-hover:text-[#003087] flex items-center justify-between">
              Tamper-Proof Protection
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Permanent digital verification ensures your medical files can never be altered.
            </p>
          </Link>
        </div>
      </section>

      {/* ── HOW MEDICHAIN PROTECTS YOU (3 SIMPLE STEPS) ──────────────────── */}
      <section className="bg-white border border-[#d1dbe5] rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl font-bold text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Simple, Private, and Patient-First
          </h2>
          <p className="text-xs sm:text-sm text-[#4a5568] mt-1">
            MediChain keeps healthcare simple. Here is how your records are protected:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#f7f9fa] border border-[#e2e8f0] rounded-xl p-6 relative">
            <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-sm mb-4">
              1
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-2">
              You Upload & Lock Your File
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Your report or prescription is encrypted with bank-level security before it is stored. No unauthorized eyes can read it.
            </p>
          </div>

          <div className="bg-[#f7f9fa] border border-[#e2e8f0] rounded-xl p-6 relative">
            <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-sm mb-4">
              2
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-2">
              You Control Who Sees It
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Only you decide which doctors can view your file. When your consultation or treatment is complete, you can remove access anytime.
            </p>
          </div>

          <div className="bg-[#f7f9fa] border border-[#e2e8f0] rounded-xl p-6 relative">
            <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-sm mb-4">
              3
            </div>
            <h3 className="font-bold text-[#00205b] text-base mb-2">
              Protected Against Changes
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              A unique digital stamp is saved permanently. If anyone tries to alter a single number or word in your report, it will be caught immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ── PEACE-OF-MIND STATUS BAR ─────────────────────────────────────── */}
      <section className="bg-[#eef4fa] border border-[#bfdbfe] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#00205b]">
              MediChain Network is Active & Secure
            </h4>
            <p className="text-xs text-[#4a5568]">
              All security checks are operational. Your medical data is encrypted and backed up.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {apiOnline ? 'All Systems Running Smoothly' : 'System Offline'}
          </span>
        </div>
      </section>

    </div>
  )
}
