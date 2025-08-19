
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
import type { Employee, AppSettings } from '@/lib/types';
import Payslip from '@/components/payslip';

export default function PayslipClientPage({
  initialEmployees,
  settings,
}: {
  initialEmployees: Employee[];
  settings: AppSettings;
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

    // This is where you would typically fetch real salary data for the period.
    // For this example, we'll use static data from the employee object.
    const earnings = {
      basicSalary: employee.basicSalary || 5000000,
      transportAllowance: employee.transportAllowance || 500000,
      mealAllowance: employee.mealAllowance || 750000,
    };
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
