import { PrismaClient, Role, EmploymentStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create Device
    await prisma.device.upsert({
        where: { ip: '192.168.1.201' },
        update: {},
        create: {
            name: 'Main Entrance Biometric',
            ip: '192.168.1.201',
            port: 4370,
            location: 'Main Lobby',
            isActive: true,
            updatedAt: new Date(),
        },
    })
    console.log('📟 Device seeded')

    // 2. Seed Admin and HR accounts
    const passwordHash = await bcrypt.hash('password123', 10)

    const users: {
        email: string
        firstName: string
        lastName: string
        role: Role
        department: string
        position: string
        employeeNumber: string
        zkId: number
    }[] = [
            {
                email: 'admin@bits.com',
                firstName: 'Admin',
                lastName: 'User',
                role: Role.ADMIN,
                department: 'Operations',
                position: 'System Administrator',
                employeeNumber: 'EMP001',
                zkId: 1,
            },
            {
                email: 'hr@bits.com',
                firstName: 'Maria',
                lastName: 'Santos',
                role: Role.HR,
                department: 'HR',
                position: 'HR Manager',
                employeeNumber: 'EMP002',
                zkId: 2,
            },
        ]

    for (const u of users) {
        await prisma.employee.upsert({
            where: { email: u.email },
            update: {},
            create: {
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                password: passwordHash,
                role: u.role,
                employmentStatus: EmploymentStatus.ACTIVE,
                department: u.department,
                position: u.position,
                branch: 'Main Office',
                employeeNumber: u.employeeNumber,
                zkId: u.zkId,
                hireDate: new Date('2024-01-15'),
                updatedAt: new Date(),
            },
        })
        console.log(`👤 Seeded: ${u.email} (${u.role})`)
    }

    console.log('✅ Seed completed')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
