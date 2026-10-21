import { Router } from 'express'
import { getRecordAccess } from '../controllers/recordController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/:recordId', authenticate, getRecordAccess)

export default router
