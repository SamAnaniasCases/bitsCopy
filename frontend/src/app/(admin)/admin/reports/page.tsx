'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Search,
  ChevronRight,
  FileText,
  Users,
  Clock,
  TrendingUp,
  ChevronLeft
} from 'lucide-react'

// Define interfaces
interface Employee {
  id: number
  firstName: string
  lastName: string
  department: string | null
  branch: string | null
  position: string | null
  status: string
}

interface AttendanceRecord {
  id: number
  date: string
  checkInTime: string
  checkOutTime: string | null
  status: 'present' | 'late' | 'absent' | 'incomplete'
  employee: {
    id: number
  }
}

interface ReportRow {
  id: number
  name: string
  department: string
  branch: string
  totalDays: number
  present: number
  late: number
  absent: number
  totalHours: number
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')

  // Default to current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0])

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const [reportData, setReportData] = useState<ReportRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return

        // 1. Fetch Employees
        const empResponse = await fetch('http://localhost:3001/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const empResult = await empResponse.json()
        const employees: Employee[] = empResult.success ? empResult.data : []

        // Extract Filters
        const uniqueBranches = Array.from(new Set(employees.map(e => e.branch).filter(Boolean) as string[])) // Type assertion for filter(Boolean)
        const uniqueDepts = Array.from(new Set(employees.map(e => e.department).filter(Boolean) as string[]))
        setBranches(uniqueBranches)
        setDepartments(uniqueDepts)

        // 2. Fetch Attendance for the range
        const queryParams = new URLSearchParams({ startDate, endDate })
        const attResponse = await fetch(`http://localhost:3001/api/attendance?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const attResult = await attResponse.json()
        const attendance: AttendanceRecord[] = attResult.success ? attResult.data : []

        // 3. Process Data
        // Calculate total days in range (inclusive)
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const totalDaysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

        const processedData: ReportRow[] = employees.map(emp => {
          const empRecords = attendance.filter(r => r.employee.id === emp.id)

          const presentCount = empRecords.filter(r => r.status === 'present' || r.status === 'late').length
          const lateCount = empRecords.filter(r => r.status === 'late').length
          const absentCount = empRecords.filter(r => r.status === 'absent').length

          // Calculate detailed hours
          let totalHours = 0
          empRecords.forEach(r => {
            if (r.checkOutTime) {
              const checkIn = new Date(r.checkInTime)
              const checkOut = new Date(r.checkOutTime)
              const duration = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
              totalHours += duration
            }
          })

          return {
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department || 'Unassigned',
            branch: emp.branch || 'Unassigned',
            totalDays: totalDaysInRange, // Simple duration for now
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            totalHours: totalHours
          }
        })

        setReportData(processedData)

      } catch (error) {
        console.error('Error generating report:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate]) // Re-run when date range changes

  // Filter Logic
  const filteredData = reportData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept
    const matchesBranch = selectedBranch === 'all' || emp.branch === selectedBranch
    return matchesSearch && matchesDept && matchesBranch
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Summary stats
  const totalRecords = filteredData.length
  // Avoid division by zero
  const avgAttendance = filteredData.length > 0 && filteredData.some(e => e.totalDays > 0)
    ? Math.round(filteredData.reduce((sum, e) => sum + ((e.present / Math.max(e.totalDays, 1)) * 100), 0) / filteredData.length)
    : 0

  const totalLate = filteredData.reduce((sum, e) => sum + e.late, 0)
  const totalHoursRendered = filteredData.reduce((sum, e) => sum + e.totalHours, 0)

  const handleExport = () => {
    const headers = ['Employee', 'Department', 'Branch', 'Total Days', 'Present', 'Late', 'Absent', 'Total Hours']
    const rows = filteredData.map(e => [
      e.name,
      e.department,
      e.branch,
      e.totalDays,
      e.present,
      e.late,
      e.absent,
      e.totalHours.toFixed(2)
    ])

    // Append summary row
    rows.push([])
    rows.push(['--- SUMMARY ---'])
    rows.push(['Total Employees', totalRecords])
    rows.push(['Avg. Attendance', `${avgAttendance}%`])
    rows.push(['Total Late', totalLate])
    rows.push(['Total Hours', totalHoursRendered.toFixed(2)])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    const branchLabel = selectedBranch === 'all' ? 'All-Branches' : selectedBranch.replace(/\s+/g, '-')
    const deptLabel = selectedDept === 'all' ? 'All-Depts' : selectedDept
    link.download = `Report_${branchLabel}_${deptLabel}_${startDate}_to_${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading && reportData.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full animate-spin mb-4">
            <div className="w-8 h-8 bg-background rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Generating report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">Generate and export attendance reports</p>
        </div>
        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Total Employees</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 sm:mt-2">{totalRecords}</p>
            </div>
            <div className="bg-primary/20 p-2 sm:p-3 rounded-lg">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Avg. Attendance</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 sm:mt-2">{avgAttendance}%</p>
            </div>
            <div className="bg-green-500/20 p-2 sm:p-3 rounded-lg">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Total Late</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 sm:mt-2">{totalLate}</p>
            </div>
            <div className="bg-yellow-500/20 p-2 sm:p-3 rounded-lg">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Hours Rendered</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 sm:mt-2">{totalHoursRendered.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-primary/20 p-2 sm:p-3 rounded-lg">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date range + Branch + Department */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="bg-secondary border-border text-foreground w-full sm:w-36"
              />
              <span className="text-muted-foreground text-xs font-medium shrink-0">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="bg-secondary border-border text-foreground w-full sm:w-36"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="flex-1 sm:w-40 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="flex-1 sm:w-40 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Table */}
      <Card className="bg-card border-border overflow-hidden rounded-2xl shadow-lg">
        <div className="px-4 sm:px-6 py-4 border-b border-border bg-secondary/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filteredData.length} records
          </p>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 w-fit text-xs">
            {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} – {new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-secondary/50 backdrop-blur-sm">
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Department</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Present</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Late</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Absent</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Hours</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={`hover:bg-primary/5 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'}`}
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {employee.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{employee.name}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">{employee.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <Badge variant="outline" className="bg-secondary/50 text-foreground border-border">
                      {employee.department}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="text-sm text-green-400 font-bold">{employee.present}</span>
                    <span className="text-xs text-muted-foreground">/{employee.totalDays}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`text-sm font-medium ${employee.late > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                      {employee.late}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                    <span className={`text-sm font-medium ${employee.absent > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {employee.absent}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-mono text-foreground">{employee.totalHours.toFixed(2)}</td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No records found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-4 bg-secondary/20 border-t border-border flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 sm:px-3 border-border text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <span className="sm:hidden text-xs text-muted-foreground px-2">{currentPage}/{totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 sm:px-3 border-border text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
