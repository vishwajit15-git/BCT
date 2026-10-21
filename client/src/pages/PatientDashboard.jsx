import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWeb3 } from '../context/Web3Context.jsx'
import { api } from '../services/api.js'
import {
  FileText,
  Upload,
  Shield,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Search,
  UserCheck
} from 'lucide-react'

export default function PatientDashboard() {
  const { user } = useAuth()
  const { account } = useWeb3()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await api.getMyRecords()
        if (res.success && res.records) {
          setRecords(res.records)
        }
      } catch (err) {
        console.error('Failed to fetch patient records:', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  const filteredRecords = records.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recordType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recordId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Patient Welcome Hero */}
      <div className="bg-white border-l-4 border-[#003087] border-y border-r border-[#d1dbe5] rounded-r-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#003087] uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-[#003087]" />
              <span>Personal Health Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome, {user?.name || 'Patient'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4a5568] mt-1 max-w-2xl">
              Welcome to your health dashboard. All your medical documents are privately encrypted and protected from alterations. You decide which doctors can view your records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/upload" className="mayo-btn-primary">
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
            <Link to="/access" className="mayo-btn-outline">
              <UserCheck className="w-4 h-4" />
              <span>Manage Doctor Access</span>
            </Link>
          </div>
        </div>

        {/* Connected account indicator */}
        <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex flex-wrap items-center gap-4 text-xs text-[#4a5568]">
          <div>
            Account Address: <span className="font-mono text-[#00205b] font-semibold">{user?.walletAddress}</span>
          </div>
          {account && (
            <div className="flex items-center gap-1.5">
              <span>Wallet:</span>
              <span className={`inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded text-[11px] ${
                account === user?.walletAddress?.toLowerCase()
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {account.slice(0, 6)}…{account.slice(-4)}
                {account === user?.walletAddress?.toLowerCase() ? ' (Connected)' : ' (Different Wallet)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Record summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d1dbe5] rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-[#4a5568] uppercase">Saved Documents</div>
          <div className="text-3xl font-bold text-[#00205b] mt-1">{records.length}</div>
          <p className="text-[11px] text-[#4a5568] mt-1">Stored securely and privately</p>
        </div>

        <div className="bg-white border border-[#d1dbe5] rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-[#4a5568] uppercase">Protected Records</div>
          <div className="text-3xl font-bold text-emerald-700 mt-1">
            {records.filter((r) => r.onChainConfirmed).length}
          </div>
          <p className="text-[11px] text-[#4a5568] mt-1">Protected against any alterations</p>
        </div>

        <div className="bg-white border border-[#d1dbe5] rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-[#4a5568] uppercase">Privacy Standard</div>
          <div className="text-base font-bold text-[#003087] mt-2 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#003087]" />
            Bank-Level Encryption
          </div>
          <p className="text-[11px] text-[#4a5568] mt-1">Only you and approved doctors have access</p>
        </div>
      </div>

      {/* Records table section */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#d1dbe5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
              My Health Documents
            </h2>
            <p className="text-xs text-[#4a5568]">Click any document to view details, download, or check authenticity</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#a0aec0] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or type…"
              className="w-full bg-[#f7f9fa] border border-[#d1dbe5] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#4a5568]">Loading your health documents…</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-[#eef4fa] rounded-full flex items-center justify-center mx-auto mb-3 text-[#003087]">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#00205b]">No Medical Documents Yet</h3>
            <p className="text-xs text-[#4a5568] mt-1 mb-4">
              You have not uploaded any lab reports or prescriptions yet.
            </p>
            <Link to="/upload" className="mayo-btn-primary text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Your First Document</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f9fa] border-b border-[#d1dbe5] text-[#4a5568] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Verification Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredRecords.map((r) => (
                  <tr key={r.recordId} className="hover:bg-[#fafcff] transition">
                    <td className="py-3.5 px-4 font-semibold text-[#00205b]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#003087] flex-shrink-0" />
                        <span>{r.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-[11px] bg-[#eef4fa] text-[#003087] font-medium border border-[#bfdbfe]">
                        {r.recordType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#4a5568]" title={r.documentHash}>
                      {r.documentHash.slice(0, 10)}…{r.documentHash.slice(-8)}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.onChainConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Protected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Processing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#4a5568]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/records/${r.recordId}`}
                        className="text-[#003087] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>View</span>
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
