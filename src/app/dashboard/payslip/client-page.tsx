
'use client';

import { useState, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';

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
  const [attendanceDays, setAttendanceDays] = useState<number>(22);
  const { toast } = useToast();

  const selectedEmployeePosition = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const employee = initialEmployees.find((e) => e.id === selectedEmployeeId);
    if (!employee || !employee.position) return null;
    return positions.find((p) => p.name === employee.position) || null;
  }, [selectedEmployeeId, initialEmployees, positions]);

  const handleGenerate = () => {
    if (!selectedEmployeeId || !period) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an employee and a period.',
      });
      return;
    }
    const employee = initialEmployees.find((e) => e.id === selectedEmployeeId);
    if (!employee) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Employee not found.',
      });
      return;
    }
    
    const position = positions.find(p => p.name === employee.position);
    if (!position || !position.salaryType) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Salary details for this employee\'s position are not set.',
        });
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
        // We'll calculate based on attendance days
        earnings = {
            dailyWage: (position.dailyWage || 0) * attendanceDays,
            // Example 10 overtime hours - this could be another input field in the future
            overtime: (position.overtimeRate || 0) * 10, 
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
      attendanceDays: position.salaryType === 'harian' ? attendanceDays : undefined,
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
             {selectedEmployeePosition?.salaryType === 'harian' && (
               <div className="space-y-2">
                <Label htmlFor="attendance">Jumlah Kehadiran (hari)</Label>
                <Input
                  id="attendance"
                  type="number"
                  value={attendanceDays}
                  onChange={(e) => setAttendanceDays(Number(e.target.value))}
                  placeholder="e.g. 22"
                />
              </div>
            )}
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
