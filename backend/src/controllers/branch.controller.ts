import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/branches
export const getAllBranches = async (_req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branches' });
  }
};

// POST /api/branches
export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }

    const branch = await prisma.branch.create({
      data: { name: name.trim().toUpperCase() },
      select: { id: true, name: true },
    });
    res.status(201).json({ success: true, branch });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Branch already exists' });
    }
    console.error('Error creating branch:', error);
    res.status(500).json({ success: false, message: 'Failed to create branch' });
  }
};

// DELETE /api/branches/:id
export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid branch ID' });
    }

    await prisma.branch.delete({ where: { id } });
    res.json({ success: true, message: 'Branch deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    console.error('Error deleting branch:', error);
    res.status(500).json({ success: false, message: 'Failed to delete branch' });
  }
};
