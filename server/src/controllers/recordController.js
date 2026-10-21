import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import MedicalRecord from '../models/MedicalRecord.js'
import {
  calculateSHA256,
  generateRecordId,
  encryptBuffer,
  decryptBuffer,
} from '../utils/crypto.js'
import {
  checkOnChainAccess,
  verifyOnChainHash,
  getOnChainRecordMetadata,
  getRecordAuditEvents,
} from '../services/blockchain.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

/**
 * POST /api/records
 * Upload and encrypt a new medical record (PDF only, max 10MB).
 * Access: Patient only.
 */
export async function uploadRecord(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Medical PDF file is required.' })
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only PDF medical documents are supported.',
      })
    }

    const { title, recordType } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Record title is required.' })
    }

    const originalBuffer = req.file.buffer
    // 1. Calculate cryptographic SHA-256 hash of original file bytes (0x... bytes32 format)
    const documentHash = calculateSHA256(originalBuffer)
    const recordId = generateRecordId()

    // 2. Encrypt original file bytes using authenticated AES-256-GCM
    const { encryptedData, iv, authTag } = encryptBuffer(originalBuffer)

    // 3. Store encrypted payload off-chain on the filesystem
    const encryptedFileName = `${recordId.replace('0x', '')}.enc`
    const encryptedFilePath = path.join(UPLOADS_DIR, encryptedFileName)
    fs.writeFileSync(encryptedFilePath, encryptedData)

    // 4. Save metadata in MongoDB
    const record = await MedicalRecord.create({
      recordId,
      patientId: req.user._id,
      patientWalletAddress: req.user.walletAddress.toLowerCase(),
      title: title.trim(),
      recordType: recordType || 'lab_report',
      documentHash,
      originalFilename: req.file.originalname,
      mimeType: 'application/pdf',
      fileSize: req.file.size,
      encryptedFileName,
      iv,
      authTag,
      onChainConfirmed: false,
    })

    res.status(201).json({
      success: true,
      message: 'Medical record encrypted and prepared for blockchain registration.',
      record: {
        recordId: record.recordId,
        title: record.title,
        recordType: record.recordType,
        documentHash: record.documentHash,
        originalFilename: record.originalFilename,
        fileSize: record.fileSize,
        createdAt: record.createdAt,
        onChainConfirmed: false,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/records/:id/confirm
 * Confirms on-chain transaction hash after patient executes registerRecord in MetaMask.
 */
export async function confirmRecord(req, res, next) {
  try {
    const { id } = req.params
    const { txHash } = req.body

    const query = id.startsWith('0x') ? { recordId: id } : { _id: id }
    const record = await MedicalRecord.findOne(query)

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' })
    }

    if (record.patientWalletAddress !== req.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Only the record owner can confirm registration.' })
    }

    record.onChainTxHash = txHash || record.onChainTxHash
    record.onChainConfirmed = true
    await record.save()

    res.json({
      success: true,
      message: 'Record confirmed on-chain.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/records/mine
 * Retrieves records belonging to the patient, or records accessible by the doctor.
 */
export async function getMyRecords(req, res, next) {
  try {
    if (req.user.role === 'patient') {
      const records = await MedicalRecord.find({
        $or: [
          { patientId: req.user._id },
          { patientWalletAddress: req.user.walletAddress.toLowerCase() },
        ],
      }).sort({ createdAt: -1 })

      return res.json({ success: true, records })
    }

    // Role is doctor: find records where doctor currently has on-chain permission
    const allRecords = await MedicalRecord.find({}).sort({ createdAt: -1 })
    const accessibleRecords = []

    for (const rec of allRecords) {
      const allowed = await checkOnChainAccess(rec.recordId, req.user.walletAddress)
      if (allowed) {
        accessibleRecords.push(rec)
      }
    }

    res.json({
      success: true,
      records: accessibleRecords,
      note: 'Showing records where your doctor wallet currently has confirmed on-chain access.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/records/:id
 * Fetches record metadata. Validates permission on-chain before granting access.
 */
export async function getRecordById(req, res, next) {
  try {
    const { id } = req.params
    const query = id.startsWith('0x') ? { recordId: id } : { _id: id }
    const record = await MedicalRecord.findOne(query)

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' })
    }

    // Check permission
    const isOwner = record.patientWalletAddress === req.user.walletAddress.toLowerCase()
    let hasDoctorAccess = false

    if (!isOwner) {
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ success: false, message: 'Access denied.' })
      }
      hasDoctorAccess = await checkOnChainAccess(record.recordId, req.user.walletAddress)
      if (!hasDoctorAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have current on-chain permission to view this medical record.',
        })
      }
    }

    // Fetch on-chain status if available
    const onChainMeta = await getOnChainRecordMetadata(record.recordId)

    res.json({
      success: true,
      record,
      access: {
        isOwner,
        hasDoctorAccess,
      },
      onChainMeta,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/records/:id/download
 * Verifies on-chain permission, decrypts authenticated AES-256-GCM file in memory, and serves the PDF.
 */
export async function downloadRecord(req, res, next) {
  try {
    const { id } = req.params
    const query = id.startsWith('0x') ? { recordId: id } : { _id: id }
    const record = await MedicalRecord.findOne(query).select('+encryptedFileName +iv +authTag')

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' })
    }

    // Authorization check
    const isOwner = record.patientWalletAddress === req.user.walletAddress.toLowerCase()
    if (!isOwner) {
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ success: false, message: 'Access denied.' })
      }
      // Must have active on-chain permission
      const hasAccess = await checkOnChainAccess(record.recordId, req.user.walletAddress)
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Current smart contract permission check failed. Access has been revoked or never granted.',
        })
      }
    }

    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName)
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ success: false, message: 'Encrypted document file is missing on storage.' })
    }

    const encryptedBuffer = fs.readFileSync(encryptedFilePath)

    // Decrypt the file using authenticated AES-256-GCM
    let decryptedBuffer
    try {
      decryptedBuffer = decryptBuffer(encryptedBuffer, record.iv, record.authTag)
    } catch (cryptoErr) {
      return res.status(500).json({
        success: false,
        message: 'Decryption failed: cryptographic integrity check (GCM tag) failed. File may be corrupted or tampered.',
      })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(record.originalFilename)}"`
    )
    res.setHeader('Content-Length', decryptedBuffer.length)
    res.send(decryptedBuffer)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/records/:id/verify
 * Decrypts the stored file, recalculates the SHA-256 hash, and compares it directly
 * with the immutable hash registered in the smart contract.
 */
export async function verifyRecordIntegrity(req, res, next) {
  try {
    const { id } = req.params
    const query = id.startsWith('0x') ? { recordId: id } : { _id: id }
    const record = await MedicalRecord.findOne(query).select('+encryptedFileName +iv +authTag')

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' })
    }

    // Authorization check: owner or authorized doctor
    const isOwner = record.patientWalletAddress === req.user.walletAddress.toLowerCase()
    if (!isOwner) {
      const allowed = await checkOnChainAccess(record.recordId, req.user.walletAddress)
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have on-chain permission to audit this record.',
        })
      }
    }

    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName)
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ success: false, message: 'Encrypted storage file not found.' })
    }

    const encryptedBuffer = fs.readFileSync(encryptedFilePath)
    let decryptedBuffer
    try {
      decryptedBuffer = decryptBuffer(encryptedBuffer, record.iv, record.authTag)
    } catch (cryptoErr) {
      return res.json({
        success: true,
        recordId: record.recordId,
        status: 'TAMPERED',
        verified: false,
        computedHash: 'TAMPERED_CIPHERTEXT',
        onChainRegisteredHash: record.documentHash,
        onChainMatch: false,
        matchesDatabaseHash: false,
        timestamp: new Date().toISOString(),
        details: 'CRYPTOGRAPHIC INTEGRITY MISMATCH! AES-256-GCM authentication check failed. File payload has been modified or corrupted on storage.',
      })
    }

    // Recalculate original document SHA-256 hash
    const computedHash = calculateSHA256(decryptedBuffer)

    // Query on-chain smart contract function: verifyDocumentHash
    const onChainMatch = await verifyOnChainHash(record.recordId, computedHash)
    const matchesDatabaseHash = computedHash.toLowerCase() === record.documentHash.toLowerCase()

    const isVerified = onChainMatch && matchesDatabaseHash

    res.json({
      success: true,
      recordId: record.recordId,
      status: isVerified ? 'VERIFIED' : 'TAMPERED',
      verified: isVerified,
      computedHash,
      onChainRegisteredHash: record.documentHash,
      onChainMatch,
      matchesDatabaseHash,
      timestamp: new Date().toISOString(),
      details: isVerified
        ? 'Decrypted document hash matches the immutable on-chain ledger hash. File integrity is verified.'
        : 'CRYPTOGRAPHIC INTEGRITY MISMATCH! The computed document hash does not match the registered on-chain hash.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/access/:recordId
 * Returns doctor permission status for a record.
 */
export async function getRecordAccess(req, res, next) {
  try {
    const { recordId } = req.params
    const record = await MedicalRecord.findOne({ recordId })

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' })
    }

    // Only owner can inspect full access list or doctors can inspect their own
    const isOwner = record.patientWalletAddress === req.user.walletAddress.toLowerCase()
    const doctorAddress = req.query.doctor || req.user.walletAddress

    const hasAccess = await checkOnChainAccess(recordId, doctorAddress)

    res.json({
      success: true,
      recordId,
      checkedWallet: doctorAddress,
      hasAccess,
      isOwner,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/audit/:recordId
 * Retrieves immutable blockchain event history for the record.
 */
export async function getRecordAudit(req, res, next) {
  try {
    const { recordId } = req.params
    const events = await getRecordAuditEvents(recordId)

    res.json({
      success: true,
      recordId,
      eventCount: events.length,
      events,
    })
  } catch (err) {
    next(err)
  }
}
