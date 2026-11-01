import { Router } from 'express'
import { generateImage } from '../controllers/generationController.js'

const router = Router()

router.post('/generate', generateImage)

export default router