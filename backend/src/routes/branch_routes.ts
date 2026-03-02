import { Router } from 'express';
import { getAllBranches, createBranch, deleteBranch } from '../controllers/branch.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOrHR } from '../middleware/role.middleware';

const router = Router();

// GET all branches (authenticated)
router.get('/', authenticate, getAllBranches);

// POST create branch (admin/HR only)
router.post('/', authenticate, adminOrHR, createBranch);

// DELETE branch (admin/HR only)
router.delete('/:id', authenticate, adminOrHR, deleteBranch);

export default router;
