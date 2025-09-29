

import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import PayrollClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getKoperasiOrders } from '@/actions/koperasi';
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
import { getMonth, getYear, parse } from 'date-fns';

const BPJS_RATES: Record<string, number> = {
    miki: 280000,
    iba: 322000,
};


export default async function PayrollPage({ userSiteId }: { userSiteId?: string }) {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  
  const [employees, positions, attendanceRecords, allKoperasiOrders] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getPositions(),
    getAttendanceByPeriod(currentPeriod, { siteId: userSiteId }),
    getKoperasiOrders({}), // Fetch all orders, will be filtered by employee and period
  ]);
  
  const periodDate = parse(currentPeriod, 'yyyy-MM', new Date());
  const periodMonth = getMonth(periodDate);
  const periodYear = getYear(periodDate);

  const employeesWithDetails: EmployeeWithDetails[] = employees
  .filter(emp => emp.canGeneratePayslip !== false)
  .map(emp => {
      const positionDetails: Position[] = (emp.positions || [])
        .map(posName => positions.find(p => p.name === posName))
        .filter((p): p is Position => !!p);
        
      const attendance = attendanceRecords.find(a => a.employeeId === emp.id);

      let totalEarnings = 0;

      positionDetails.forEach(pos => {
          if (pos.salaryType === 'bulanan' || pos.salaryType === 'direksi') {
              const baseSalary = pos.monthlySalary || 0;
              const allowancesTotal = pos.allowances?.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;
              totalEarnings += baseSalary + allowancesTotal;
          } else if (pos.salaryType === 'harian') {
              const attendanceForPos = attendance?.attendanceByPosition?.[pos.name] || 0;
              const overtimeForPos = attendance?.overtimeByPosition?.[pos.name] || 0;
              
              if (attendanceForPos > 0) {
                  totalEarnings += (pos.dailyWage || 0) * attendanceForPos;
              }
              
              if (overtimeForPos > 0) {
                  totalEarnings += (pos.overtimeRate || 0) * overtimeForPos;
              }
          }
      });
      
      if(attendance?.bonus) {
          totalEarnings += attendance.bonus;
      }

      let totalDeductions = 0;
      if (emp.bpjsStatus === 'active' && emp.bpjsType && BPJS_RATES[emp.bpjsType]) {
        totalDeductions += BPJS_RATES[emp.bpjsType];
      }
      if (attendance?.potonganPph) totalDeductions += attendance.potonganPph;
      if (attendance?.potonganIdCard) totalDeductions += attendance.potonganIdCard;
      if (attendance?.potonganSimper) totalDeductions += attendance.potonganSimper;
      if (attendance?.potonganDenda) totalDeductions += attendance.potonganDenda;
      
      const koperasiSpending = allKoperasiOrders
        .filter(order => {
          const orderDate = new Date(order.orderDate);
          return order.employeeId === emp.id && 
                 order.status !== 'Rejected' &&
                 getMonth(orderDate) === periodMonth &&
                 getYear(orderDate) === periodYear;
        })
        .reduce((sum, order) => sum + order.totalPrice, 0);

      if (koperasiSpending > 0) {
          totalDeductions += koperasiSpending;
      }
      
      const netSalary = totalEarnings - totalDeductions;

      return { 
          ...emp, 
          positionDetails,
          netSalary
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
