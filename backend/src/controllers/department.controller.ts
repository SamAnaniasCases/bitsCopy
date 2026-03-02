import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/departments
export const getAllDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

// POST /api/departments
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const department = await prisma.department.create({
      data: { name: name.trim().toUpperCase() },
      select: { id: true, name: true },
    });
    res.status(201).json({ success: true, department });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Department already exists' });
    }
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
};

// DELETE /api/departments/:id
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID' });
    }

    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
};
