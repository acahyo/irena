

import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import PayrollClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { EmployeeWithDetails, Position } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History } from 'lucide-react';


export default async function PayrollPage({ userSiteId }: { userSiteId?: string }) {
  const [employees, positions] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getPositions()
  ]);

  // Fetch attendance for the current month to calculate salary for daily workers
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialAttendance = await getAttendanceByPeriod(currentPeriod, { siteId: userSiteId });
  
  const employeesWithDetails: EmployeeWithDetails[] = employees.map(emp => {
      const positionDetails: Position[] = (emp.positions || [])
        .map(posName => positions.find(p => p.name === posName))
        .filter((p): p is Position => !!p);
        
      const attendanceDetails = initialAttendance.find(a => a.employeeId === emp.id);

      let totalSalary = 0;
      
      positionDetails.forEach(pos => {
          if (pos.salaryType === 'bulanan' || pos.salaryType === 'direksi') {
              const baseSalary = pos.monthlySalary || 0;
              const allowancesTotal = pos.allowances?.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;
              totalSalary += baseSalary + allowancesTotal;
          } else if (pos.salaryType === 'harian') {
              const attendanceDays = attendanceDetails?.attendanceByPosition?.[pos.name] || 0;
              const overtimeHours = attendanceDetails?.overtimeByPosition?.[pos.name] || 0;
              
              totalSalary += ((pos.dailyWage || 0) * attendanceDays) + 
                            ((pos.overtimeRate || 0) * overtimeHours);
          }
      });
      

      return { 
          ...emp, 
          positionDetails,
          totalSalary: totalSalary
      };
  });

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Alat Payroll</CardTitle>
                    <CardDescription>
                    Gunakan alat di bawah ini untuk mengelola penggajian.
                    </CardDescription>
                </div>
                <Button asChild>
                    <Link href="/dashboard/payroll/history">
                    <History className="mr-2 h-4 w-4" />
                    Lihat Riwayat Payroll
                    </Link>
                </Button>
                </div>
            </CardHeader>
        </Card>

        <PayrollClientPage
            employees={employeesWithDetails}
        />
    </div>
  );
}
