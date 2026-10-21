import { Router } from 'express'
import { getRecordAudit } from '../controllers/recordController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/:recordId', authenticate, getRecordAudit)

export default router
