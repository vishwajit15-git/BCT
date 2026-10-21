import { Router } from 'express'
import multer from 'multer'
import {
  uploadRecord,
  confirmRecord,
  getMyRecords,
  getRecordById,
  downloadRecord,
  verifyRecordIntegrity,
} from '../controllers/recordController.js'
import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = Router()

// Configure multer for memory storage and file size limit (10MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF medical documents and prescriptions are allowed.'), false)
    }
  },
})

// Routes
router.get('/', async (_req, res, next) => {
  try {
    const MedicalRecord = (await import('../models/MedicalRecord.js')).default
    const records = await MedicalRecord.find({}).sort({ createdAt: -1 }).limit(50)
    res.json({
      success: true,
      count: records.length,
      records,
    })
  } catch (err) {
    next(err)
  }
})

router.post(
  '/',
  authenticate,
  authorizeRole('patient'),
  upload.single('document'),
  uploadRecord
)

router.patch(
  '/:id/confirm',
  authenticate,
  authorizeRole('patient'),
  confirmRecord
)

router.get('/mine', authenticate, getMyRecords)
router.get('/:id', authenticate, getRecordById)
router.get('/:id/download', authenticate, downloadRecord)
router.post('/:id/verify', authenticate, verifyRecordIntegrity)

export default router
