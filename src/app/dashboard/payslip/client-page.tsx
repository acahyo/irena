
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';
import type { Employee, AppSettings, Position } from '@/lib/types';
import Payslip from '@/components/payslip';

export default function PayslipClientPage({
  initialEmployees,
  settings,
  positions,
}: {
  initialEmployees: Employee[];
  settings: AppSettings;
  positions: Position[];
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payslipData, setPayslipData] = useState<any>(null);

  const handleGenerate = () => {
    if (!selectedEmployeeId || !period) {
      alert('Please select an employee and a period.');
      return;
    }
    const employee = initialEmployees.find((e) => e.id === selectedEmployeeId);
    if (!employee) {
      alert('Employee not found');
      return;
    }
    
    const position = positions.find(p => p.name === employee.position);
    if (!position || !position.salaryType) {
        alert('Salary details for this employee\'s position are not set.');
        return;
    }

    // This is where you would typically fetch real salary data for the period.
    // For this example, we'll use static data from the employee's position object.
    let earnings: Record<string, number> = {};
    if(position.salaryType === 'bulanan') {
        earnings = {
            monthlySalary: position.monthlySalary || 0,
            otAllowance: position.otAllowance || 0,
            locationAllowance: position.locationAllowance || 0,
            mealAllowance: position.mealAllowance || 0,
            otherAllowances: position.otherAllowances || 0,
        };
    } else { // harian
        // This is a simplification. Real calculation would need attendance data.
        // We'll calculate for 22 work days as an example.
        const workDays = 22;
        earnings = {
            dailyWage: (position.dailyWage || 0) * workDays,
            overtime: (position.overtimeRate || 0) * 10, // Example 10 overtime hours
        }
    }


    const deductions = {
      tax: 250000,
      bpjs: 150000,
    };
    const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + val, 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    const netSalary = totalEarnings - totalDeductions;

    setPayslipData({
      employee,
      period,
      earnings,
      deductions,
      totalEarnings,
      totalDeductions,
      netSalary,
      position,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Cetak Slip Gaji</CardTitle>
          <CardDescription>
            Pilih karyawan dan periode untuk membuat slip gaji.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee">Karyawan</Label>
              <Select
                onValueChange={setSelectedEmployeeId}
                value={selectedEmployeeId || ''}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {initialEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.nik})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Periode</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={handleGenerate}>Buat Slip Gaji</Button>
          </div>
        </CardContent>
      </Card>

      {payslipData && (
        <>
          <Payslip data={payslipData} settings={settings} />
          <div className="flex justify-center print:hidden">
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
