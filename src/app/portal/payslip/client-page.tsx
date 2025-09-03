
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
import type { EmployeeWithPosition, AppSettings, AttendanceRecord } from '@/lib/types';
import PayslipViewer, { type PayslipData } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByEmployeeAndPeriod } from '@/actions/attendance';

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
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
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
  
  // Effect to fetch attendance data when period changes
  useEffect(() => {
    const fetchAttendance = async () => {
        if (!period) {
            setAttendanceRecord(null);
            return;
        };
        setIsFetchingAttendance(true);
        try {
            const record = await getAttendanceByEmployeeAndPeriod(employee.id, period);
            setAttendanceRecord(record);
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
    
    const position = employee.positionDetails;
    if (!position || !position.salaryType) {
        toast({ variant: 'destructive', title: T.error, description: T.noSalaryDetails });
        return;
    }
    
    const attendanceDays = attendanceRecord?.attendanceDays || 0;
    const overtimeHours = attendanceRecord?.overtimeHours || 0;
    const bonus = attendanceRecord?.bonus || 0;

    let earnings: Record<string, number> = {};
    if(position.salaryType === 'bulanan' || position.salaryType === 'direksi') {
        earnings.monthlySalary = position.monthlySalary || 0;
        position.allowances?.forEach(allowance => {
            earnings[allowance.name] = allowance.amount;
        });
    } else if (position.salaryType === 'harian') { // harian
        earnings = {
            dailyWage: (position.dailyWage || 0) * attendanceDays,
            overtime: (position.overtimeRate || 0) * overtimeHours, 
        }
    }
    
    if (bonus > 0) {
        earnings.bonus = bonus;
    }

    const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + val, 0);
    
    const deductions: Record<string, number> = {};
    
    let bpjsDeduction = 0;
    if (employee.bpjsStatus === 'active' && employee.bpjsType && BPJS_RATES[employee.bpjsType]) {
        bpjsDeduction = BPJS_RATES[employee.bpjsType];
    }
    if (bpjsDeduction > 0) {
        deductions.bpjs = bpjsDeduction;
    }

    deductions.tax = totalEarnings * 0.02; // PPH 21
    
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

    setPayslipData({
      id: employee.id,
      employee: employee,
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
          <CardTitle>{T.title}</CardTitle>
          <CardDescription>{T.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-2 w-full sm:w-auto sm:flex-1">
              <Label htmlFor="period">{T.periodLabel}</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
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
