import { Router } from 'express';
import { getAllDepartments, createDepartment, deleteDepartment } from '../controllers/department.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOrHR } from '../middleware/role.middleware';

const router = Router();

// GET all departments (authenticated)
router.get('/', authenticate, getAllDepartments);

// POST create department (admin/HR only)
router.post('/', authenticate, adminOrHR, createDepartment);

// DELETE department (admin/HR only)
router.delete('/:id', authenticate, adminOrHR, deleteDepartment);

export default router;
