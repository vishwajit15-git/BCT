import mongoose from 'mongoose'

const medicalRecordSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Record ID must be a 32-byte hex string (bytes32)'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid patient wallet address format'],
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    recordType: {
      type: String,
      enum: {
        values: [
          'lab_report',
          'prescription',
          'diagnostic_imaging',
          'discharge_summary',
          'consultation_note',
          'other',
        ],
        message: 'Invalid record category',
      },
      required: [true, 'Record type is required'],
      default: 'lab_report',
    },
    documentHash: {
      type: String,
      required: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Document hash must be a 32-byte hex string (bytes32)'],
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf'],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    encryptedFileName: {
      type: String,
      required: true,
      select: false, // Hidden from standard API queries
    },
    iv: {
      type: String,
      required: true,
      select: false, // Hidden from standard API queries
    },
    authTag: {
      type: String,
      required: true,
      select: false, // Hidden from standard API queries
    },
    onChainTxHash: {
      type: String,
      default: null,
    },
    onChainConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema)
export default MedicalRecord
