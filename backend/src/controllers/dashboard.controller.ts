import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Employee Stats
        const totalEmployees = await prisma.employee.count({
            where: { employmentStatus: { not: 'TERMINATED' } }
        });

        const activeEmployees = await prisma.employee.count({
            where: { employmentStatus: 'ACTIVE' }
        });

        // 2. Attendance Stats (Today)
        const attendanceToday = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        const totalPresent = attendanceToday.filter(a => a.status === 'present').length;
        const totalLate = attendanceToday.filter(a => a.status === 'late').length;
        const totalAbsent = attendanceToday.filter(a => a.status === 'absent').length; // This might need more logic if absent records aren't pre-generated

        // Calculate rates/overtime if needed, for now use basic counts
        // Mocking overtime/undertime for now or calculate from actual times if available
        const totalOvertime = 0;
        const totalUndertime = 0;

        // 3. Department Breakdown
        const employeesByDept = await prisma.employee.groupBy({
            by: ['department'],
            _count: {
                id: true
            },
            where: {
                employmentStatus: 'ACTIVE',
                department: { not: null }
            }
        });

        const deptBreakdown = employeesByDept.map(dept => ({
            department: dept.department || 'Unassigned',
            employeeCount: dept._count.id,
            attendanceRate: 0 // To be calculated ideally
        }));

        // Calculate attendance rate per department
        // This is expensive to do casually, effectively we'd need to join attendance with employee
        // For MVP, let's keep it simple or do a quick lookup if needed.
        // Let's iterate departments and count today's attendance for them
        for (const dept of deptBreakdown) {
            if (dept.department === 'Unassigned') continue;

            const deptEmployees = await prisma.employee.findMany({
                where: { department: dept.department, employmentStatus: 'ACTIVE' },
                select: { id: true }
            });
            const empIds = deptEmployees.map(e => e.id);

            const deptAttendance = await prisma.attendance.count({
                where: {
                    date: { gte: today, lt: tomorrow },
                    employeeId: { in: empIds },
                    status: { in: ['present', 'late'] }
                }
            });

            dept.attendanceRate = dept.employeeCount > 0
                ? Math.round((deptAttendance / dept.employeeCount) * 100)
                : 0;
        }

        // 4. Weekly Trend (Last 7 days)
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const dailyStats = await prisma.attendance.groupBy({
                by: ['status'],
                where: {
                    date: {
                        gte: date,
                        lt: nextDate
                    }
                },
                _count: {
                    id: true
                }
            });

            const present = dailyStats.find(s => s.status === 'present')?._count.id || 0;
            const late = dailyStats.find(s => s.status === 'late')?._count.id || 0;
            const absent = dailyStats.find(s => s.status === 'absent')?._count.id || 0;

            weeklyTrend.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                present,
                late,
                absent
            });
        }

        // 5. Recent Activity
        const recentActivityRaw = await prisma.attendanceLog.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: {
                Employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        department: true
                    }
                }
            }
        });

        const recentActivity = recentActivityRaw.map(log => ({
            id: log.id,
            employee: `${log.Employee.firstName} ${log.Employee.lastName}`,
            department: log.Employee.department || 'Unassigned',
            action: 'Check In/Out', // Log doesn't explicitly store "Check In" vs "Check Out" in simple mode, usually inferred
            time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'on-time' // simplified
        }));

        res.json({
            success: true,
            stats: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees
                },
                attendance: {
                    totalPresent,
                    totalLate,
                    totalAbsent,
                    totalOvertime,
                    totalUndertime
                },
                departments: deptBreakdown,
                weeklyTrend,
                recentActivity
            }
        });

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            error: error.message
        });
    }
};
