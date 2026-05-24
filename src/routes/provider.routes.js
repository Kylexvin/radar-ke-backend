import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  onboardAsProvider,
  getProvider,
  getMyProviderProfile,
  updateProvider,
  toggleAvailability,
  updateLocation,
  updateCapabilities,
  addShowcaseItem,
  updateShowcaseItem,
  deleteShowcaseItem,
  toggleShowcaseItem,
  getProviderShowcase,
  getProviderAnalytics,
} from '../controllers/provider.controller.js';

const router = express.Router();

// ── Public routes ──────────────────────────────────────────
router.get('/:id/showcase', getProviderShowcase);  // public showcase browse
router.get('/:id', getProvider);                   // public profile

// ── Protected routes ───────────────────────────────────────
router.use(authenticate);

// Profile
router.post('/onboard', onboardAsProvider);
router.get('/me', getMyProviderProfile);
router.put('/me', updateProvider);
router.patch('/me/toggle', toggleAvailability);
router.patch('/me/location', updateLocation);

// Capabilities
router.patch('/me/capabilities', updateCapabilities);

// Showcase management (owner)
router.get('/me/analytics', getProviderAnalytics);
router.post('/me/showcase', addShowcaseItem);
router.put('/me/showcase/:itemId', updateShowcaseItem);
router.delete('/me/showcase/:itemId', deleteShowcaseItem);
router.patch('/me/showcase/:itemId/toggle', toggleShowcaseItem);

export default router;