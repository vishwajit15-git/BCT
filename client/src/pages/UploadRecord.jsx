import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWeb3 } from '../context/Web3Context.jsx'
import { api } from '../services/api.js'
import {
  Upload,
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Loader2,
  Check
} from 'lucide-react'

export default function UploadRecord() {
  const { user } = useAuth()
  const {
    account,
    connectWallet,
    isCorrectNetwork,
    registerRecordOnChain,
    expectedChainId,
  } = useWeb3()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [recordType, setRecordType] = useState('lab_report')
  const [file, setFile] = useState(null)

  // Multi-step process state: 'idle' | 'uploading' | 'signing' | 'confirming' | 'completed' | 'error'
  const [stage, setStage] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [txDetails, setTxDetails] = useState(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Please select a PDF document. PDF format ensures your medical file stays original and clear.')
        setFile(null)
        return
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit. Please upload a smaller PDF.')
        setFile(null)
        return
      }
      setError('')
      setFile(selected)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a medical report or prescription PDF to upload.')
      return
    }

    if (!account) {
      setError('Please connect your digital wallet above before uploading so you can confirm ownership of your document.')
      return
    }

    if (!isCorrectNetwork) {
      setError(`Please switch your wallet network to the local MediChain network (Network ID: ${expectedChainId}).`)
      return
    }

    setError('')
    setStage('uploading')
    setStatusMessage('Step 1 of 3: Encrypting and protecting your document…')

    try {
      // Step 1: Upload to backend for AES encryption & SHA-256 fingerprinting
      const formData = new FormData()
      formData.append('document', file)
      formData.append('title', title)
      formData.append('recordType', recordType)

      const uploadRes = await api.uploadRecord(formData)
      if (!uploadRes.success || !uploadRes.record) {
        throw new Error(uploadRes.message || 'File protection failed.')
      }

      const { recordId, documentHash } = uploadRes.record

      // Step 2: Confirm in wallet
      setStage('signing')
      setStatusMessage('Step 2 of 3: Please click "Confirm" in your wallet popup…')

      const txResult = await registerRecordOnChain(recordId, documentHash)

      // Step 3: Final confirmation
      setStage('confirming')
      setStatusMessage('Step 3 of 3: Saving your record and creating your receipt…')

      await api.confirmRecord(recordId, txResult.txHash)

      setTxDetails({
        recordId,
        documentHash,
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
      })

      setStage('completed')
    } catch (err) {
      console.error('Record registration error:', err)
      setStage('error')
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Upload cancelled in wallet. Your document was not saved.')
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to complete record upload.')
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="bg-white border border-[#d1dbe5] rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="border-b border-[#d1dbe5] pb-5 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#003087] uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-[#003087]" />
            <span>Secure Patient Upload</span>
          </div>
          <h1 className="text-2xl font-black text-[#00205b]" style={{ fontFamily: 'Georgia, serif' }}>
            Add a Medical Document
          </h1>
          <p className="text-xs text-[#4a5568] mt-1">
            Upload a doctor's report, lab test, or prescription. Your document is privately encrypted, and protected against any alterations.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {stage === 'completed' && txDetails ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <span>Document Saved & Protected!</span>
            </div>

            <p className="text-xs text-[#4a5568] leading-relaxed">
              Your medical document is now safely stored and encrypted. Only you and doctors you choose have permission to view it.
            </p>

            <div className="bg-white p-3.5 rounded-lg border border-emerald-200 font-mono text-xs space-y-1.5 text-gray-800">
              <div>
                <span className="text-[#4a5568]">Record Number: </span>
                <span className="text-[#00205b] font-bold break-all">{txDetails.recordId}</span>
              </div>
              <div>
                <span className="text-[#4a5568]">Verification Fingerprint: </span>
                <span className="text-[#00205b] break-all">{txDetails.documentHash}</span>
              </div>
              <div>
                <span className="text-[#4a5568]">Confirmation Receipt: </span>
                <span className="text-emerald-700 break-all">{txDetails.txHash}</span>
              </div>
              <div>
                <span className="text-[#4a5568]">Saved in Block: </span>
                <span className="font-bold">#{txDetails.blockNumber}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={`/records/${txDetails.recordId}`} className="mayo-btn-primary text-xs">
                <span>View My Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/patient" className="mayo-btn-outline text-xs">
                Back to My Records
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#00205b] mb-1">
                Document Title
              </label>
              <input
                type="text"
                required
                disabled={stage !== 'idle' && stage !== 'error'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Blood Test & Checkup Report"
                className="w-full bg-white border border-[#d1dbe5] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#1a202c] placeholder-[#a0aec0] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#00205b] mb-1">
                Document Type
              </label>
              <select
                value={recordType}
                disabled={stage !== 'idle' && stage !== 'error'}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full bg-white border border-[#d1dbe5] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#1a202c] focus:ring-2 focus:ring-[#003087] focus:outline-none"
              >
                <option value="lab_report">Laboratory Test Report</option>
                <option value="prescription">Doctor Prescription</option>
                <option value="diagnostic_imaging">X-Ray, MRI, or Scan Report</option>
                <option value="discharge_summary">Hospital Discharge Summary</option>
                <option value="consultation_note">Doctor Consultation Note</option>
                <option value="other">Other Medical Document</option>
              </select>
            </div>

            {/* File upload box */}
            <div>
              <label className="block text-xs font-semibold text-[#00205b] mb-1">
                Select PDF File (Up to 10MB)
              </label>
              <div className="border-2 border-dashed border-[#d1dbe5] hover:border-[#003087] rounded-xl p-6 text-center transition bg-[#f7f9fa]">
                <FileText className="w-8 h-8 text-[#003087] mx-auto mb-2" />
                <input
                  type="file"
                  id="pdfUpload"
                  accept="application/pdf"
                  disabled={stage !== 'idle' && stage !== 'error'}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="pdfUpload"
                  className="cursor-pointer text-xs font-bold text-[#003087] hover:underline"
                >
                  {file ? file.name : 'Click here to choose your PDF file'}
                </label>
                <p className="text-[11px] text-[#4a5568] mt-1">
                  {file
                    ? `File selected: ${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : 'Accepted format: .pdf files'}
                </p>
              </div>
            </div>

            {/* Wallet notice if not connected */}
            {!account && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-[#00205b]">
                <span>Please connect your digital wallet above to save your record.</span>
                <button
                  type="button"
                  onClick={connectWallet}
                  className="mayo-btn-primary text-xs px-3 py-1 font-bold whitespace-nowrap"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {/* Progress indicator */}
            {stage !== 'idle' && stage !== 'error' && (
              <div className="p-4 bg-[#eef4fa] border border-[#bfdbfe] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00205b]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#003087]" />
                  <span>{statusMessage}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 bg-[#003087] transition-all duration-500 ${
                      stage === 'uploading'
                        ? 'w-1/3'
                        : stage === 'signing'
                        ? 'w-2/3'
                        : 'w-full'
                    }`}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={stage !== 'idle' && stage !== 'error'}
              className="w-full mayo-btn-primary py-2.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>
                {stage === 'idle' || stage === 'error'
                  ? 'Protect & Save Document'
                  : 'Saving Document…'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
