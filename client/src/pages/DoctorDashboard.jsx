import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWeb3 } from '../context/Web3Context.jsx'
import { api } from '../services/api.js'
import {
  Stethoscope,
  Search,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock,
  UserCheck
} from 'lucide-react'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { account } = useWeb3()
  const [accessibleRecords, setAccessibleRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchRecordId, setSearchRecordId] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function loadAccessible() {
      try {
        const res = await api.getMyRecords()
        if (res.success && res.records) {
          setAccessibleRecords(res.records)
        }
      } catch (err) {
        console.error('Error fetching doctor records:', err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAccessible()
  }, [])

  const handleLookupRecord = async (e) => {
    e.preventDefault()
    if (!searchRecordId.trim()) return

    setSearching(true)
    setSearchError('')
    setSearchResult(null)

    try {
      const res = await api.getRecordById(searchRecordId.trim())
      if (res.success && res.record) {
        setSearchResult(res.record)
      }
    } catch (err) {
      setSearchError(
        err.response?.data?.message ||
          'Could not find record. Either the record does not exist or the patient has not given you access.'
      )
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Doctor Hero */}
      <div className="bg-white border-l-4 border-[#003087] border-y border-r border-[#d1dbe5] rounded-r-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#003087] uppercase tracking-wider mb-1">
              <Stethoscope className="w-4 h-4 text-[#003087]" />
              <span>Doctor Consultation Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome, Dr. {user?.name || 'Physician'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4a5568] mt-1 max-w-2xl">
              Access medical records and test reports authorized by your patients. You can review clinical documents and confirm that each file is authentic.
            </p>
          </div>

          <div className="text-right">
            <span className="mayo-badge-online">Verified Physician</span>
            {user?.specialization && (
              <p className="text-xs text-[#4a5568] mt-1">Specialty: <span className="font-semibold text-[#00205b]">{user.specialization}</span></p>
            )}
            {user?.licenseNumber && (
              <p className="text-[11px] text-[#4a5568]">License ID: <span className="font-mono text-gray-700">{user.licenseNumber}</span></p>
            )}
          </div>
        </div>

        {/* Doctor account notice */}
        <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex flex-wrap items-center gap-4 text-xs text-[#4a5568]">
          <div>
            Your Doctor Account Address: <span className="font-mono text-[#00205b] font-semibold">{user?.walletAddress}</span>
          </div>
          {account && (
            <div className="flex items-center gap-1">
              <span>Wallet:</span>
              <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                account === user?.walletAddress?.toLowerCase()
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {account.slice(0, 6)}…{account.slice(-4)}
                {account === user?.walletAddress?.toLowerCase() ? ' (Connected)' : ' (Different Address)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Record ID Lookup Form */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#00205b] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Look Up a Patient Record
        </h2>
        <p className="text-xs text-[#4a5568] mb-4">
          Enter a record number provided by your patient to view the document.
        </p>

        <form onSubmit={handleLookupRecord} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchRecordId}
            onChange={(e) => setSearchRecordId(e.target.value)}
            placeholder="e.g. 0x9a9845e14175963a..."
            className="mayo-input flex-1 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={searching}
            className="mayo-btn-primary text-xs whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{searching ? 'Searching…' : 'Open Document'}</span>
          </button>
        </form>

        {searchError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}

        {searchResult && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800">Document Found & Access Verified:</span>
              <p className="text-sm font-bold text-[#00205b] mt-0.5">{searchResult.title}</p>
              <p className="text-xs font-mono text-[#4a5568] mt-0.5">Verification Code: {searchResult.documentHash.slice(0, 16)}…</p>
            </div>
            <Link
              to={`/records/${searchResult.recordId}`}
              className="mayo-btn-primary text-xs"
            >
              <span>View Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Accessible Records List */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#d1dbe5]">
          <h2 className="text-lg font-bold text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Patient Records Shared with You
          </h2>
          <p className="text-xs text-[#4a5568]">
            These documents have been shared with your doctor account by patients.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#4a5568]">Loading shared patient records…</div>
        ) : accessibleRecords.length === 0 ? (
          <div className="py-14 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-[#eef4fa] rounded-full flex items-center justify-center mx-auto mb-3 text-[#003087]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#00205b]">No Patient Documents Currently Shared</h3>
            <p className="text-xs text-[#4a5568] mt-1">
              Ask your patient to share access with your doctor account address:
            </p>
            <p className="font-mono text-xs bg-slate-100 p-2 rounded mt-2 text-[#00205b] break-all select-all">
              {user?.walletAddress}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f9fa] border-b border-[#d1dbe5] text-[#4a5568] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Patient Account</th>
                  <th className="py-3 px-4">Verification Code</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {accessibleRecords.map((r) => (
                  <tr key={r.recordId} className="hover:bg-[#fafcff] transition">
                    <td className="py-3.5 px-4 font-semibold text-[#00205b]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#003087]" />
                        <span>{r.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 capitalize">{r.recordType.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-mono text-[#4a5568]">
                      {r.patientWalletAddress.slice(0, 8)}…{r.patientWalletAddress.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#4a5568]">
                      {r.documentHash.slice(0, 10)}…
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/records/${r.recordId}`}
                        className="mayo-btn-outline text-xs px-3 py-1 font-bold inline-flex items-center gap-1"
                      >
                        <span>Open Document</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
