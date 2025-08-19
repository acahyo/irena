
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import { Printer, Loader2 } from 'lucide-react';
import type { EmployeeWithPosition, AppSettings, Position, AttendanceRecord, Department } from '@/lib/types';
import PayslipViewer, { type PayslipData } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByEmployeeAndPeriod } from '@/actions/attendance';

export default function PayslipClientPage({
  initialEmployees,
  settings,
  initialAttendance,
  departments,
}: {
  initialEmployees: EmployeeWithPosition[];
  settings: AppSettings;
  initialAttendance: AttendanceRecord[];
  departments: Department[];
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [attendanceDays, setAttendanceDays] = useState<number>(0);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const { toast } = useToast();
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredEmployees = useMemo(() => {
    if (departmentFilter === 'all') {
        return initialEmployees;
    }
    return initialEmployees.filter(emp => emp.department === departmentFilter);
  }, [initialEmployees, departmentFilter]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return initialEmployees.find((e) => e.id === selectedEmployeeId) || null;
  }, [selectedEmployeeId, initialEmployees]);
  
  // When filter changes, if the selected employee is no longer in the filtered list, reset it.
  useEffect(() => {
    if (selectedEmployeeId && !filteredEmployees.find(e => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(null);
        setPayslipData(null);
    }
  }, [filteredEmployees, selectedEmployeeId]);

  // Effect to fetch attendance data when employee or period changes
  useEffect(() => {
    const fetchAttendance = async () => {
        if (!selectedEmployeeId || !period) {
            setAttendanceDays(0);
            setOvertimeHours(0);
            return;
        };
        setIsFetchingAttendance(true);
        try {
            // First, check initial attendance data passed from server
            const initialRecord = initialAttendance.find(rec => rec.employeeId === selectedEmployeeId && rec.period === period);
            if (initialRecord) {
                setAttendanceDays(initialRecord.attendanceDays || 0);
                setOvertimeHours(initialRecord.overtimeHours || 0);
            } else {
                // If not found (e.g., period changed), fetch from db
                const record = await getAttendanceByEmployeeAndPeriod(selectedEmployeeId, period);
                setAttendanceDays(record?.attendanceDays || 0);
                setOvertimeHours(record?.overtimeHours || 0);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance data.' });
            setAttendanceDays(0);
            setOvertimeHours(0);
        } finally {
            setIsFetchingAttendance(false);
        }
    };
    fetchAttendance();
  }, [selectedEmployeeId, period, toast, initialAttendance]);

  const handleGenerate = () => {
    if (!selectedEmployeeId || !period || !selectedEmployee) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an employee and a period.',
      });
      return;
    }
    
    const position = selectedEmployee.positionDetails;
    if (!position || !position.salaryType) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Salary details for this employee\'s position are not set.',
        });
        return;
    }

    let earnings: Record<string, number> = {};
    if(position.salaryType === 'bulanan') {
        // For monthly salary, we can assume full salary unless logic for deductions based on attendance is added
        earnings = {
            monthlySalary: position.monthlySalary || 0,
            otAllowance: position.otAllowance || 0,
            locationAllowance: position.locationAllowance || 0,
            mealAllowance: position.mealAllowance || 0,
            otherAllowances: position.otherAllowances || 0,
        };
    } else { // harian
        earnings = {
            dailyWage: (position.dailyWage || 0) * attendanceDays,
            overtime: (position.overtimeRate || 0) * overtimeHours, 
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
      id: selectedEmployee.id,
      employee: selectedEmployee,
      period,
      earnings,
      deductions,
      totalEarnings,
      totalDeductions,
      netSalary,
      position,
      attendanceDays: attendanceDays,
      overtimeHours: overtimeHours,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Cetak Slip Gaji</CardTitle>
          <CardDescription>
            Pilih karyawan dan periode untuk membuat slip gaji. Data absensi akan terisi otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
             <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Departemen</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
                  {filteredEmployees.map((emp) => (
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
            <div className="space-y-2">
              <Label htmlFor="attendance">Jumlah Kehadiran (hari)</Label>
              <Input
                id="attendance"
                type="number"
                value={attendanceDays}
                onChange={(e) => setAttendanceDays(Number(e.target.value))}
                placeholder="e.g. 22"
                disabled={isFetchingAttendance || selectedEmployee?.positionDetails?.salaryType !== 'harian'}
              />
            </div>
             {selectedEmployee?.positionDetails?.salaryType === 'harian' && (
               <div className="space-y-2">
                <Label htmlFor="overtime">Jumlah Jam Lembur</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  placeholder="e.g. 10"
                  disabled={isFetchingAttendance}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={handleGenerate} disabled={isFetchingAttendance}>
                {isFetchingAttendance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Slip Gaji
            </Button>
          </div>
        </CardContent>
      </Card>

      {payslipData && (
        <PayslipViewer 
            payslips={[payslipData]}
            settings={settings}
            showControls={true}
        />
      )}
    </div>
  );
}
