import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Clock,
  Shield,
  Layers,
  Search,
  CheckCircle,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react'

export default function TransactionHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [auditEvents, setAuditEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMyRecords() {
      try {
        const res = await api.getMyRecords()
        if (res.success && res.records && res.records.length > 0) {
          setRecords(res.records)
          setSelectedRecordId(res.records[0].recordId)
          fetchAudit(res.records[0].recordId)
        }
      } catch (err) {
        console.error('Error fetching records for history:', err.message)
      }
    }

    loadMyRecords()
  }, [])

  const fetchAudit = async (recordId) => {
    if (!recordId) return
    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const res = await api.getRecordAudit(recordId)
      if (res.success) {
        setAuditEvents(res.events || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load activity history.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (selectedRecordId.trim()) {
      fetchAudit(selectedRecordId.trim())
    }
  }

  const getFriendlyEventName = (eventName) => {
    switch (eventName) {
      case 'RecordRegistered':
        return 'Document Added & Protected'
      case 'AccessGranted':
        return 'Doctor Access Granted'
      case 'AccessRevoked':
        return 'Doctor Access Removed'
      default:
        return eventName
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="border-b border-[#d1dbe5] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#003087] uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4 text-[#003087]" />
          <span>Activity Log</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
          Document Activity & History
        </h1>
        <p className="text-xs text-[#4a5568] mt-1">
          Review every action taken on your medical files, including when files were saved and when doctor permissions were given or cancelled.
        </p>
      </div>

      {/* Record selector */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-semibold text-[#00205b] mb-1">
              Select Medical Document
            </label>
            {records.length > 0 ? (
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full bg-[#f7f9fa] border border-[#d1dbe5] rounded-lg px-3.5 py-2 text-xs text-[#1a202c] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              >
                {records.map((r) => (
                  <option key={r.recordId} value={r.recordId}>
                    {r.title} — Record #{r.recordId.slice(0, 10)}…
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                placeholder="Enter record number..."
                className="w-full bg-[#f7f9fa] border border-[#d1dbe5] rounded-lg px-3.5 py-2 text-xs font-mono text-[#1a202c] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto mayo-btn-primary text-xs px-5 py-2.5 font-bold self-end"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Loading…' : 'View Activity'}</span>
          </button>
        </form>
      </div>

      {/* Timeline of events */}
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-[#00205b] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Activity Timeline
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#4a5568]">Loading activity records…</div>
        ) : auditEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#4a5568]">
            {searched
              ? 'No activity recorded yet for this document.'
              : 'Select a document above to see its activity timeline.'}
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-[#d1dbe5] space-y-6">
            {auditEvents.map((ev, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-white border-2 border-[#003087] flex items-center justify-center text-[#003087] shadow-sm">
                  {ev.event === 'RecordRegistered' && <FileText className="w-4 h-4 text-emerald-600" />}
                  {ev.event === 'AccessGranted' && <UserCheck className="w-4 h-4 text-[#003087]" />}
                  {ev.event === 'AccessRevoked' && <UserX className="w-4 h-4 text-red-600" />}
                </div>

                <div className="bg-[#f7f9fa] border border-[#e2e8f0] rounded-xl p-4 space-y-2 hover:border-[#003087] transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        ev.event === 'RecordRegistered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ev.event === 'AccessGranted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getFriendlyEventName(ev.event)}
                    </span>
                    <span className="text-[11px] text-[#4a5568] flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Block #{ev.blockNumber}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-[#00205b] space-y-1">
                    <div>
                      <span className="text-gray-500">Receipt ID: </span>
                      <span className="break-all font-semibold">{ev.txHash}</span>
                    </div>

                    {ev.doctor && (
                      <div>
                        <span className="text-gray-500">Doctor Account: </span>
                        <span className="break-all">{ev.doctor}</span>
                      </div>
                    )}

                    {ev.documentHash && (
                      <div>
                        <span className="text-gray-500">Verification Code: </span>
                        <span className="break-all">{ev.documentHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
