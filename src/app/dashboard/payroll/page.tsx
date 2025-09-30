

import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import PayrollClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getKoperasiOrders } from '@/actions/koperasi';
import type { EmployeeWithDetails, Position, PayrollRecord } from '@/lib/types';
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
import { getHseRecords } from '@/actions/hse';

const BPJS_RATES: Record<string, number> = {
    miki: 280000,
    iba: 322000,
};


export default async function PayrollPage({ userSiteId }: { userSiteId?: string }) {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  
  const [employees, positions, attendanceRecords, allKoperasiOrders, hseRecords] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getPositions(),
    getAttendanceByPeriod(currentPeriod, { siteId: userSiteId }),
    getKoperasiOrders({}), // Fetch all orders, will be filtered by employee and period
    getHseRecords(),
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
      const attendanceDays = attendance?.attendanceByPosition ? Object.values(attendance.attendanceByPosition).reduce((a, b) => a + (b || 0), 0) : 0;

      const earnings: Record<string, number> = {};
      let totalEarnings = 0;

      positionDetails.forEach(pos => {
          if (pos.salaryType === 'bulanan' || pos.salaryType === 'direksi') {
              const baseSalary = pos.monthlySalary || 0;
              
              if(pos.salaryType === 'bulanan') {
                const dailyRate = baseSalary / 30;
                const calculatedSalary = dailyRate * attendanceDays;
                earnings[`Gaji Pokok - ${pos.name}`] = calculatedSalary;
                totalEarnings += calculatedSalary;
              } else { // Direksi gets full salary
                earnings[`Gaji Pokok - ${pos.name}`] = baseSalary;
                totalEarnings += baseSalary;
              }
              
              pos.allowances?.forEach(allowance => {
                  earnings[`${allowance.name} - ${pos.name}`] = allowance.amount;
                  totalEarnings += allowance.amount;
              });

          } else if (pos.salaryType === 'harian') {
              const attendanceForPos = attendance?.attendanceByPosition?.[pos.name] || 0;
              const overtimeForPos = attendance?.overtimeByPosition?.[pos.name] || 0;
              
              if (attendanceForPos > 0) {
                  const dailyIncome = (pos.dailyWage || 0) * attendanceForPos;
                  earnings[`dailyWage-${pos.name}`] = dailyIncome;
                  totalEarnings += dailyIncome;
              }
              
              if (overtimeForPos > 0) {
                  const overtimeIncome = (pos.overtimeRate || 0) * overtimeForPos;
                  earnings[`overtime-${pos.name}`] = overtimeIncome;
                  totalEarnings += overtimeIncome;
              }
          }
      });
      
      if(attendance?.bonus) {
          earnings.bonus = attendance.bonus;
          totalEarnings += attendance.bonus;
      }

      const deductions: Record<string, number> = {};
      if (emp.bpjsStatus === 'active' && emp.bpjsType && BPJS_RATES[emp.bpjsType]) {
        deductions.bpjs = BPJS_RATES[emp.bpjsType];
      }
      if (attendance?.potonganPph) deductions.potonganPph = attendance.potonganPph;
      if (attendance?.potonganIdCard) deductions.potonganIdCard = attendance.potonganIdCard;
      if (attendance?.potonganSimper) deductions.potonganSimper = attendance.potonganSimper;
      if (attendance?.potonganDenda) deductions.potonganDenda = attendance.potonganDenda;
      
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
          deductions.potonganKoperasi = koperasiSpending;
      }
      
      const hseFineDeduction = hseRecords
        .filter(record => 
            record.employeeId === emp.id &&
            record.hasFine &&
            record.fineAmount &&
            record.fineDeductionPeriods &&
            record.fineDeductionPeriods > 0
        )
        .reduce((sum, record) => {
            const monthlyDeduction = (record.fineAmount || 0) / (record.fineDeductionPeriods || 1);
            return sum + monthlyDeduction;
        }, 0);

      if (hseFineDeduction > 0) {
          deductions.potonganHse = hseFineDeduction;
      }

      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
      const netSalary = totalEarnings - totalDeductions;

      return { 
          ...emp, 
          positionDetails,
          netSalary,
          totalEarnings,
          totalDeductions,
          earnings,
          deductions,
          keterangan: '',
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
            period={currentPeriod}
        />
    </div>
  );
}

