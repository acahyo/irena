'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Printer, Loader2 } from 'lucide-react';
import type { EmployeeWithPosition, AppSettings, AttendanceRecord, Position } from '@/lib/types';
import PayslipViewer, { type PayslipData } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByEmployeeAndPeriod } from '@/actions/attendance';
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

const BPJS_RATES: Record<string, number> = {
    miki: 280000,
    iba: 322000,
};

export default function MyPayslipClientPage({
  employee,
  settings,
  initialAttendance,
}: {
  employee: EmployeeWithPosition;
  settings: AppSettings;
  initialAttendance: AttendanceRecord | null;
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(initialAttendance);
  const { toast } = useToast();
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  const lang = settings.language || 'id';

  const T = useMemo(() => ({
      title: lang === 'id' ? 'Unduh Slip Gaji' : 'Download Payslip',
      description: lang === 'id' ? 'Pilih periode untuk membuat dan mengunduh slip gaji Anda.' : 'Select a period to generate and download your payslip.',
      periodLabel: lang === 'id' ? 'Periode' : 'Period',
      generateButton: lang === 'id' ? 'Buat Slip Gaji' : 'Generate Payslip',
      error: lang === 'id' ? 'Error' : 'Error',
      noPeriod: lang === 'id' ? 'Silakan pilih periode.' : 'Please select a period.',
      noSalaryDetails: lang === 'id' ? 'Detail gaji untuk posisi Anda belum diatur.' : 'Salary details for your position are not set.',
      fetchingAttendance: lang === 'id' ? 'Mengambil data absensi...' : 'Fetching attendance...',
  }), [lang]);
  
  useEffect(() => {
    const fetchAttendance = async () => {
        if (!period) {
            setAttendanceRecord(null);
            return;
        };
        setIsFetchingAttendance(true);
        try {
            const employeeRecord = await getAttendanceByEmployeeAndPeriod(employee.id, period);
            setAttendanceRecord(employeeRecord || null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance data.' });
            setAttendanceRecord(null);
        } finally {
            setIsFetchingAttendance(false);
        }
    };
    fetchAttendance();
  }, [period, employee.id, toast]);

  const handleGenerate = () => {
    if (!period) {
      toast({ variant: 'destructive', title: T.error, description: T.noPeriod });
      return;
    }
    
    if (!employee.positionDetails || employee.positionDetails.length === 0) {
        toast({ variant: 'destructive', title: T.error, description: T.noSalaryDetails });
        return;
    }
    const position = employee.positionDetails[0];
    
    const attendanceDays = attendanceRecord?.attendanceByPosition ? Object.values(attendanceRecord.attendanceByPosition).reduce((a, b) => a + b, 0) : 0;
    const overtimeHours = attendanceRecord?.overtimeByPosition ? Object.values(attendanceRecord.overtimeByPosition).reduce((a, b) => a + b, 0) : 0;
    const bonus = attendanceRecord?.bonus || 0;

    let earnings: Record<string, number> = {};
    let totalEarnings = 0;
    
    employee.positionDetails.forEach(pos => {
      if (pos.salaryType === 'bulanan' || pos.salaryType === 'direksi') {
          const baseSalary = pos.monthlySalary || 0;
          const totalAllowances = pos.allowances?.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;
          const monthlyIncome = baseSalary + totalAllowances;
          earnings[pos.name] = monthlyIncome;
          totalEarnings += monthlyIncome;
      } else if (pos.salaryType === 'harian') {
          const attendanceForPos = attendanceRecord?.attendanceByPosition?.[pos.name] || 0;
          const overtimeForPos = attendanceRecord?.overtimeByPosition?.[pos.name] || 0;
          
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

    
    if (bonus > 0) {
        earnings.bonus = bonus;
        totalEarnings += bonus;
    }
    
    const deductions: Record<string, number> = {};
    
    let bpjsDeduction = 0;
    if (employee.bpjsStatus === 'active' && employee.bpjsType && BPJS_RATES[employee.bpjsType]) {
        bpjsDeduction = BPJS_RATES[employee.bpjsType];
    }
    if (bpjsDeduction > 0) {
      deductions.bpjs = bpjsDeduction;
    }

    if (attendanceRecord?.potonganPph) {
        deductions.potonganPph = attendanceRecord.potonganPph;
    }
    if (attendanceRecord?.potonganIdCard) {
        deductions.potonganIdCard = attendanceRecord.potonganIdCard;
    }
    if (attendanceRecord?.potonganSimper) {
        deductions.potonganSimper = attendanceRecord.potonganSimper;
    }
    if (attendanceRecord?.potonganDenda) {
        deductions.potonganDenda = attendanceRecord.potonganDenda;
    }

    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    const netSalary = totalEarnings - totalDeductions;
    const periodDate = parse(period, 'yyyy-MM', new Date());
    const periodString = format(periodDate, 'MMMM yyyy', { locale: id });

    setPayslipData({
      id: employee.id,
      employee: employee,
      period: periodString,
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
          <CardTitle>{T.title}</CardTitle>
          <CardDescription>{T.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
             <div className="space-y-2 flex-1">
                <Label htmlFor="period">{T.periodLabel}</Label>
                <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full sm:w-auto"
                />
            </div>
            <Button onClick={handleGenerate} disabled={isFetchingAttendance} className="w-full sm:w-auto">
                {isFetchingAttendance ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {isFetchingAttendance ? T.fetchingAttendance : T.generateButton}
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
