import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  onboardAsProvider,
  getProvider,
  getMyProviderProfile,
  updateProvider,
  toggleAvailability,
  updateLocation,
  
  getProviderAnalytics
} from '../controllers/provider.controller.js';

const router = express.Router();



// Protected routes (require authentication)
router.use(authenticate);

// Specific routes MUST come before parameter routes
router.post('/onboard', onboardAsProvider);
router.get('/me', getMyProviderProfile);           // <-- BEFORE /:id
router.put('/me', updateProvider);
router.patch('/me/toggle', toggleAvailability);
router.patch('/me/location', updateLocation);
router.get('/me/analytics', getProviderAnalytics);
router.get('/:id', getProvider);                   // <-- AFTER specific routes

export default router;