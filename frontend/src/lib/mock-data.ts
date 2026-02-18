
export const employees = [
    { id: 1, name: 'John Doe', department: 'Engineering', role: 'Developer' },
    { id: 2, name: 'Jane Smith', department: 'HR', role: 'Manager' },
    { id: 3, name: 'Bob Johnson', department: 'Design', role: 'Designer' },
];

export function getEmployeeStats() {
    return {
        total: 120,
        active: 118,
    };
}

export function getAttendanceStats() {
    return {
        totalPresent: 85,
        totalLate: 12,
        totalOvertime: 4,
        totalAbsent: 5,
        totalUndertime: 2,
    };
}

export function getDepartmentBreakdown() {
    return [
        { department: 'Engineering', employeeCount: 40, attendanceRate: 95 },
        { department: 'Design', employeeCount: 20, attendanceRate: 88 },
        { department: 'HR', employeeCount: 10, attendanceRate: 90 },
        { department: 'Finance', employeeCount: 15, attendanceRate: 92 },
        { department: 'Marketing', employeeCount: 25, attendanceRate: 85 },
        { department: 'Operations', employeeCount: 10, attendanceRate: 80 },
    ];
}

export function getWeeklyTrend() {
    return [
        { day: 'Mon', present: 90, late: 5, absent: 2 },
        { day: 'Tue', present: 88, late: 6, absent: 3 },
        { day: 'Wed', present: 92, late: 3, absent: 1 },
        { day: 'Thu', present: 85, late: 8, absent: 4 },
        { day: 'Fri', present: 80, late: 10, absent: 5 },
    ];
}

export function getRecentActivity() {
    return [
        {
            id: 1,
            employee: 'John Doe',
            department: 'Engineering',
            action: 'Clock In',
            time: '08:00 AM',
            status: 'on-time',
        },
        {
            id: 2,
            employee: 'Jane Smith',
            department: 'HR',
            action: 'Clock In',
            time: '08:15 AM',
            status: 'late',
        },
        {
            id: 3,
            employee: 'Bob Johnson',
            department: 'Design',
            action: 'Clock In',
            time: '09:00 AM',
            status: 'absent',
        },
        {
            id: 4,
            employee: 'Alice Brown',
            department: 'Finance',
            action: 'Clock Out',
            time: '05:00 PM',
            status: 'on-time',
        },
        {
            id: 5,
            employee: 'Charlie Davis',
            department: 'Marketing',
            action: 'Clock In',
            time: '08:30 AM',
            status: 'late',
        },
    ];
}
