import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWeb3 } from '../context/Web3Context.jsx'
import { api } from '../services/api.js'
import {
  UserCheck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  UserX,
  Search,
  Loader2,
  FileText
} from 'lucide-react'

export default function AccessManagement() {
  const [searchParams] = useSearchParams()
  const initialRecordId = searchParams.get('recordId') || ''

  const { user } = useAuth()
  const {
    account,
    connectWallet,
    isCorrectNetwork,
    grantAccessOnChain,
    revokeAccessOnChain,
  } = useWeb3()

  const [records, setRecords] = useState([])
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecordId)
  const [doctorWallet, setDoctorWallet] = useState('')

  // Status check
  const [checking, setChecking] = useState(false)
  const [currentPermission, setCurrentPermission] = useState(null) // true | false | null

  // Transaction processing state
  const [processing, setProcessing] = useState(false)
  const [actionType, setActionType] = useState('') // 'grant' | 'revoke'
  const [txSuccess, setTxSuccess] = useState(null)
  const [error, setError] = useState('')

  // Load patient records for dropdown
  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await api.getMyRecords()
        if (res.success && res.records) {
          setRecords(res.records)
          if (!selectedRecordId && res.records.length > 0) {
            setSelectedRecordId(res.records[0].recordId)
          }
        }
      } catch (err) {
        console.error('Failed to load records:', err.message)
      }
    }

    if (user?.role === 'patient') {
      loadRecords()
    }
  }, [user, selectedRecordId])

  const handleCheckPermission = async () => {
    if (!selectedRecordId || !doctorWallet.trim()) {
      setError('Please select a document and enter the doctor\'s account address.')
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(doctorWallet.trim())) {
      setError('Please enter a valid address (starts with 0x followed by 40 letters/numbers).')
      return
    }

    setError('')
    setChecking(true)
    setTxSuccess(null)

    try {
      const res = await api.getRecordAccess(selectedRecordId, doctorWallet.trim().toLowerCase())
      setCurrentPermission(res.hasAccess)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check doctor access. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleGrantAccess = async () => {
    if (!account) {
      setError('Please connect your digital wallet above to grant access.')
      return
    }
    if (!selectedRecordId || !doctorWallet.trim()) {
      setError('Please select a document and enter the doctor\'s account address.')
      return
    }

    setError('')
    setProcessing(true)
    setActionType('grant')
    setTxSuccess(null)

    try {
      const result = await grantAccessOnChain(
        selectedRecordId,
        doctorWallet.trim().toLowerCase()
      )
      setTxSuccess({
        action: 'Granted Access',
        doctor: doctorWallet.trim(),
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      })
      setCurrentPermission(true)
    } catch (err) {
      console.error('Grant access error:', err)
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Action cancelled in your wallet.')
      } else {
        setError(err.reason || err.message || 'Could not grant access. Please try again.')
      }
    } finally {
      setProcessing(false)
      setActionType('')
    }
  }

  const handleRevokeAccess = async () => {
    if (!account) {
      setError('Please connect your digital wallet above to remove access.')
      return
    }
    if (!selectedRecordId || !doctorWallet.trim()) {
      setError('Please select a document and enter the doctor\'s account address.')
      return
    }

    setError('')
    setProcessing(true)
    setActionType('revoke')
    setTxSuccess(null)

    try {
      const result = await revokeAccessOnChain(
        selectedRecordId,
        doctorWallet.trim().toLowerCase()
      )
      setTxSuccess({
        action: 'Removed Access',
        doctor: doctorWallet.trim(),
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      })
      setCurrentPermission(false)
    } catch (err) {
      console.error('Revoke access error:', err)
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Action cancelled in your wallet.')
      } else {
        setError(err.reason || err.message || 'Could not remove access. Please try again.')
      }
    } finally {
      setProcessing(false)
      setActionType('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="border-b border-[#d1dbe5] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#003087] uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4 text-[#003087]" />
          <span>Patient Privacy Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
          Doctor Access Permissions
        </h1>
        <p className="text-xs text-[#4a5568] mt-1">
          You are in full control of your medical files. Grant your doctor permission to view a document, or remove their permission anytime with one click.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {txSuccess && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Success: {txSuccess.action}!</span>
          </div>
          <p className="text-xs text-[#4a5568]">
            Doctor account: <span className="font-mono text-gray-800 break-all">{txSuccess.doctor}</span>
          </p>
          <div className="font-mono text-[11px] text-gray-600 pt-1">
            Receipt ID: <span className="text-emerald-700 break-all">{txSuccess.txHash}</span>
          </div>
        </div>
      )}

      {/* Access Control Box */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Step 1: Select record */}
        <div>
          <label className="block text-xs font-semibold text-[#00205b] mb-1.5">
            1. Select Medical Document
          </label>
          {records.length > 0 ? (
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value)
                setCurrentPermission(null)
              }}
              className="w-full bg-[#f7f9fa] border border-[#d1dbe5] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#1a202c] focus:ring-2 focus:ring-[#003087] focus:outline-none"
            >
              {records.map((r) => (
                <option key={r.recordId} value={r.recordId}>
                  {r.title} ({r.recordType.replace('_', ' ')}) — Record #{r.recordId.slice(0, 10)}…
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
              <span>You have not uploaded any records yet.</span>
              <Link to="/upload" className="font-bold underline text-[#003087]">Upload Now</Link>
            </div>
          )}
        </div>

        {/* Step 2: Doctor address */}
        <div>
          <label className="block text-xs font-semibold text-[#00205b] mb-1.5">
            2. Doctor's Account Address
          </label>
          <input
            type="text"
            value={doctorWallet}
            onChange={(e) => {
              setDoctorWallet(e.target.value)
              setCurrentPermission(null)
            }}
            placeholder="e.g. 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
            className="w-full bg-[#f7f9fa] border border-[#d1dbe5] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
          />
          <p className="text-[11px] text-[#4a5568] mt-1">
            Ask your physician or clinic for their MediChain account address.
          </p>
        </div>

        {/* Check permission button & result */}
        <div className="pt-2 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCheckPermission}
            disabled={checking}
            className="mayo-btn-outline text-xs px-4 py-2 font-semibold flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{checking ? 'Checking Status…' : 'Check Doctor\'s Access'}</span>
          </button>

          {currentPermission !== null && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#4a5568]">Current Access Status:</span>
              {currentPermission ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Access Granted (Doctor can view)
                </span>
              ) : (
                <span className="font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-red-600" />
                  No Access (Doctor is blocked)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Grant or Revoke */}
        <div className="pt-4 border-t border-[#e2e8f0] flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={processing}
            onClick={handleGrantAccess}
            className="flex-1 mayo-btn-primary py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            {processing && actionType === 'grant' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>Give Doctor Access</span>
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={handleRevokeAccess}
            className="flex-1 bg-white border border-red-300 hover:bg-red-50 text-red-700 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            {processing && actionType === 'revoke' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserX className="w-4 h-4" />
            )}
            <span>Remove Doctor Access</span>
          </button>
        </div>
      </div>

      {/* Helpful reassurance note */}
      <div className="bg-[#eef4fa] border-l-4 border-[#003087] p-4 rounded-r-lg text-xs text-[#00205b]">
        <div className="flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#003087] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Your Privacy is 100% Protected</span>
            <p className="text-[#4a5568] mt-0.5 leading-relaxed">
              When you remove doctor access, that doctor can no longer view or download your medical file from the system. You can grant access again whenever you need a consultation or second opinion.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
