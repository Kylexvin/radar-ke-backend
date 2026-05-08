import express from 'express';
import { getCategoryPresence, scanProviders } from '../controllers/scan.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public scan endpoints
router.get('/categories/presence', getCategoryPresence);
router.get('/providers', optionalAuth, scanProviders);

export default router;