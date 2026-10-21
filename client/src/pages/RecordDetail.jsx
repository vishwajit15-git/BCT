import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import {
  FileText,
  Shield,
  Download,
  CheckCircle,
  AlertTriangle,
  Lock,
  Clock,
  UserCheck,
  ArrowLeft,
  Layers,
  CheckCircle2,
  XCircle
} from 'lucide-react'

export default function RecordDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [record, setRecord] = useState(null)
  const [accessInfo, setAccessInfo] = useState(null)
  const [onChainMeta, setOnChainMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Verification state
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  // Download state
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function loadRecord() {
      try {
        const res = await api.getRecordById(id)
        if (res.success && res.record) {
          setRecord(res.record)
          setAccessInfo(res.access)
          setOnChainMeta(res.onChainMeta)
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Could not load record. You may not have permission to view this document.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadRecord()
  }, [id])

  const handleDownload = async () => {
    if (!record) return
    setDownloading(true)
    try {
      await api.downloadRecord(record.recordId, record.originalFilename)
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed: You do not have permission to download this file.')
    } finally {
      setDownloading(false)
    }
  }

  const handleVerifyIntegrity = async () => {
    if (!record) return
    setVerifying(true)
    setVerifyResult(null)

    try {
      const res = await api.verifyRecord(record.recordId)
      setVerifyResult(res)
    } catch (err) {
      alert(err.response?.data?.message || 'Verification check failed.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#4a5568]">
        <div className="w-8 h-8 border-3 border-[#003087] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <span>Loading medical document details…</span>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#00205b] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Access Denied or Document Not Found
          </h2>
          <p className="text-xs text-[#4a5568] mb-6">{error}</p>
          <Link
            to={user?.role === 'doctor' ? '/doctor' : (user ? '/patient' : '/login')}
            className="mayo-btn-outline text-xs"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button and page title */}
      <div>
        <Link
          to={user?.role === 'doctor' ? '/doctor' : '/patient'}
          className="inline-flex items-center gap-1.5 text-xs text-[#003087] font-semibold hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Portal</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d1dbe5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
              {record.title}
            </h1>
            <p className="text-xs text-[#4a5568] mt-0.5">
              Type:{' '}
              <span className="capitalize font-semibold text-[#003087]">
                {record.recordType.replace('_', ' ')}
              </span>{' '}
              • Added on {new Date(record.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="mayo-btn-outline text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing Download…' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="mayo-btn-primary text-xs font-bold"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{verifying ? 'Checking…' : 'Check File Authenticity'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verifyResult && (
        <div
          className={`p-6 rounded-xl border ${
            verifyResult.status === 'VERIFIED'
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-red-50 border-red-300'
          } shadow-sm`}
        >
          <div className="flex items-start gap-4">
            {verifyResult.status === 'VERIFIED' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-lg font-black tracking-wide ${
                    verifyResult.status === 'VERIFIED' ? 'text-emerald-800' : 'text-red-800'
                  }`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {verifyResult.status === 'VERIFIED' ? 'File Status: Genuine & Original' : 'File Status: Modified / Altered'}
                </span>
                <span className="text-xs text-gray-500">
                  Checked at {new Date(verifyResult.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                {verifyResult.status === 'VERIFIED'
                  ? 'This file matches the original upload perfectly. It has not been modified or altered in any way.'
                  : 'Warning: The contents of this file do not match the original record. The file may have been altered or corrupted.'}
              </p>

              <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs space-y-1">
                <div>
                  <span className="text-gray-500">Current Document Code: </span>
                  <span className="font-bold text-gray-900 break-all">{verifyResult.computedHash}</span>
                </div>
                <div>
                  <span className="text-gray-500">Original Protected Code: </span>
                  <span className="font-bold text-gray-900 break-all">{verifyResult.onChainRegisteredHash}</span>
                </div>
                <div>
                  <span className="text-gray-500">Integrity Check: </span>
                  <span
                    className={`font-bold ${
                      verifyResult.onChainMatch ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {verifyResult.onChainMatch ? 'MATCH — Genuine Document' : 'MISMATCH — Document Altered'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Document Details */}
        <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00205b] uppercase">
            <FileText className="w-4 h-4 text-[#003087]" />
            <span>Document Information</span>
          </div>

          <div className="text-xs space-y-2.5 divide-y divide-[#e2e8f0]">
            <div className="pt-1 flex justify-between">
              <span className="text-[#4a5568]">Filename:</span>
              <span className="font-semibold text-[#00205b]">{record.originalFilename}</span>
            </div>
            <div className="pt-2.5 flex justify-between">
              <span className="text-[#4a5568]">File Size:</span>
              <span className="font-mono text-gray-800">
                {(record.fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="pt-2.5 flex justify-between">
              <span className="text-[#4a5568]">Format:</span>
              <span className="font-mono text-gray-800">PDF Document</span>
            </div>
            <div className="pt-2.5 flex justify-between">
              <span className="text-[#4a5568]">Privacy Protection:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <Lock className="w-3 h-3" />
                Encrypted & Private
              </span>
            </div>
            <div className="pt-2.5 flex justify-between">
              <span className="text-[#4a5568]">Patient Account:</span>
              <span className="font-mono text-xs text-[#003087]" title={record.patientWalletAddress}>
                {record.patientWalletAddress.slice(0, 8)}…{record.patientWalletAddress.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Security Information */}
        <div className="bg-white border border-[#d1dbe5] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00205b] uppercase">
            <Layers className="w-4 h-4 text-[#003087]" />
            <span>Security & Protection</span>
          </div>

          <div className="text-xs space-y-2.5 divide-y divide-[#e2e8f0]">
            <div className="pt-1">
              <span className="text-[#4a5568] block mb-0.5">Record Number:</span>
              <span className="font-mono text-[11px] text-[#00205b] break-all bg-[#f7f9fa] p-1.5 rounded block">
                {record.recordId}
              </span>
            </div>

            <div className="pt-2.5">
              <span className="text-[#4a5568] block mb-0.5">Digital Fingerprint:</span>
              <span className="font-mono text-[11px] text-[#00205b] break-all bg-[#f7f9fa] p-1.5 rounded block">
                {record.documentHash}
              </span>
            </div>

            <div className="pt-2.5 flex justify-between items-center">
              <span className="text-[#4a5568]">Protection Status:</span>
              {record.onChainConfirmed ? (
                <span className="mayo-badge-online">Safely Protected</span>
              ) : (
                <span className="mayo-badge-neutral">Saving…</span>
              )}
            </div>

            {record.onChainTxHash && (
              <div className="pt-2.5">
                <span className="text-[#4a5568] block mb-0.5">Confirmation Receipt:</span>
                <span className="font-mono text-[11px] text-emerald-800 break-all bg-emerald-50 p-1.5 rounded block">
                  {record.onChainTxHash}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Patient Access Management Link */}
      {accessInfo?.isOwner && (
        <div className="bg-[#eef4fa] border border-[#bfdbfe] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#00205b] text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              Doctor Access for this Document
            </h3>
            <p className="text-xs text-[#4a5568] mt-0.5">
              You own this document. You can give a doctor permission to view it, or remove access whenever you wish.
            </p>
          </div>
          <Link
            to={`/access?recordId=${record.recordId}`}
            className="mayo-btn-primary text-xs whitespace-nowrap"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manage Doctor Access</span>
          </Link>
        </div>
      )}
    </div>
  )
}
