import express from 'express';
import { authenticate, requireProvider } from '../middleware/auth.middleware.js';
import {
  getProvider,
  getMyProviderProfile,
  updateProvider,
  toggleAvailability,
  updateLocation,
  scanProviders,
  getProviderAnalytics
} from '../controllers/provider.controller.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/scan', scanProviders);
router.get('/:id', getProvider);

// Provider-only routes (require provider authentication)
router.use(authenticate); // All routes below require authentication
router.use(requireProvider); // Must be a provider (not a regular user)

router.get('/me', getMyProviderProfile);
router.put('/me', updateProvider);
router.patch('/me/toggle', toggleAvailability);
router.patch('/me/location', updateLocation);
router.get('/me/analytics', getProviderAnalytics);

export default router;