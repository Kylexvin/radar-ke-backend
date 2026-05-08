import express from 'express';
import { 
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories
} from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (no auth needed)
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes (require auth + admin role - you can add admin middleware later)
router.post('/', authenticate, createCategory);
router.post('/seed', authenticate, seedDefaultCategories);  // One-time seed
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;