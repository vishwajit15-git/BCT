import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FileText, Shield, Search, PlusCircle, AlertCircle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

export default function Records() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const { isAuthenticated, isPatient } = useAuth()
  const [recordIdInput, setRecordIdInput] = useState(initialSearch)
  const [searchedRecord, setSearchedRecord] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const handleQuery = async (e) => {
    e.preventDefault()
    if (!recordIdInput.trim()) return

    setSearching(true)
    setError('')
    setSearchedRecord(null)

    try {
      const res = await api.getRecordById(recordIdInput.trim())
      if (res.success && res.record) {
        setSearchedRecord(res.record)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not find record. Please check the record number or verify that you have access.'
      )
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="border-b border-[#d1dbe5] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Medical Records Directory
          </h1>
          <p className="text-sm text-[#4a5568] mt-1">
            Search and verify protected health records using their unique record number.
          </p>
        </div>

        {isAuthenticated && isPatient && (
          <Link to="/upload" className="mayo-btn-primary text-xs">
            <PlusCircle className="w-4 h-4" />
            <span>Upload New Document</span>
          </Link>
        )}
      </div>

      {/* Query Search Card */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#00205b] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Look Up a Medical Record
        </h2>
        <p className="text-xs text-[#4a5568] mb-4">
          Enter a record number (starting with 0x...) to check whether it exists and view document information.
        </p>

        <form onSubmit={handleQuery} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={recordIdInput}
            onChange={(e) => setRecordIdInput(e.target.value)}
            placeholder="e.g. 0x9a9845e14175963a..."
            className="mayo-input flex-1 font-mono text-xs sm:text-sm"
          />
          <button type="submit" disabled={searching} className="mayo-btn-primary whitespace-nowrap text-xs">
            <Search className="w-4 h-4" />
            <span>{searching ? 'Searching…' : 'Look Up Record'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {searchedRecord && (
          <div className="mt-5 p-5 bg-[#fafcff] border border-[#bfdbfe] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#003087] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Record Found & Protected
              </span>
              <h3 className="text-base font-bold text-[#00205b]">{searchedRecord.title}</h3>
              <p className="text-xs text-[#4a5568]">
                Type: <span className="font-semibold">{searchedRecord.recordType.replace('_', ' ')}</span> •
                Patient Account: <span className="font-mono text-xs">{searchedRecord.patientWalletAddress.slice(0, 8)}…{searchedRecord.patientWalletAddress.slice(-6)}</span>
              </p>
              <p className="text-xs font-mono text-gray-600">
                Digital Fingerprint: {searchedRecord.documentHash.slice(0, 16)}…
              </p>
            </div>

            <Link
              to={`/records/${searchedRecord.recordId}`}
              className="mayo-btn-primary text-xs whitespace-nowrap"
            >
              <span>View Document Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Reassurance banner */}
      <div className="bg-[#eef4fa] border-l-4 border-[#003087] p-4 rounded-r-lg text-xs text-[#00205b] flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#003087] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Your Privacy is Always Maintained</p>
          <p className="text-[#4a5568] mt-0.5 leading-relaxed">
            Medical document files and personal health information are always kept private and encrypted. Only verified confirmation codes are saved to ensure no one can tamper with or forge your records.
          </p>
        </div>
      </div>
    </div>
  )
}
