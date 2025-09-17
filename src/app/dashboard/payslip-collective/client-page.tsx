'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Settings2 } from 'lucide-react';
import type { EmployeeWithPosition, AppSettings, AttendanceRecord } from '@/lib/types';
import PayslipViewer, { type PayslipData, type PayslipOptions } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

const BPJS_RATES: Record<string, number> = {
    miki: 280000,
    iba: 322000,
};

export default function PayslipCollectiveClientPage({
  initialEmployees,
  settings,
  initialAttendance,
}: {
  initialEmployees: EmployeeWithPosition[];
  settings: AppSettings;
  initialAttendance: AttendanceRecord[];
}) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [positionFilter, setPositionFilter] = useState('all');
  const [payslipsData, setPayslipsData] = useState<PayslipData[]>([]);
  const [keterangan, setKeterangan] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [isGenerating, startTransition] = useTransition();
  const { toast } = useToast();
  const [payslipOptions, setPayslipOptions] = useState<PayslipOptions>({
    showEmployeeInfo: true,
    showPaymentInfo: true,
    showSignatures: true,
  });

  const handleOptionChange = (option: keyof PayslipOptions, value: boolean) => {
    setPayslipOptions(prev => ({ ...prev, [option]: value }));
  };

  const positions = useMemo(() => {
    const allPositions = initialEmployees
      .map((emp) => emp.position)
      .filter(Boolean);
    return ['all', ...Array.from(new Set(allPositions as string[]))];
  }, [initialEmployees]);

  const filteredEmployees = useMemo(() => {
    let employees = initialEmployees.filter(emp => emp.canGeneratePayslip !== false);
    if (positionFilter === 'all') {
      return employees;
    }
    return employees.filter((emp) => emp.position === positionFilter);
  }, [initialEmployees, positionFilter]);

  useEffect(() => {
    const fetchAttendance = async () => {
        if (!period) return;
        startTransition(async () => {
            try {
                const records = await getAttendanceByPeriod(period);
                setAttendanceRecords(records);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance data for the selected period.' });
            }
        });
    };
    fetchAttendance();
  }, [period, toast]);
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        const filteredIds = new Set(filteredEmployees.map(e => e.id));
        setSelectedEmployeeIds(filteredIds);
    } else {
        setSelectedEmployeeIds(new Set());
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    const newSet = new Set(selectedEmployeeIds);
    if (checked) {
        newSet.add(employeeId);
    } else {
        newSet.delete(employeeId);
    }
    setSelectedEmployeeIds(newSet);
  };

  const handleGenerate = () => {
    if (selectedEmployeeIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one employee.',
      });
      return;
    }
    if (!period) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a valid period.',
      });
      return;
    }

    startTransition(() => {
        const generatedPayslips: PayslipData[] = [];
        const periodDate = parse(period, 'yyyy-MM', new Date());
        const periodString = format(periodDate, 'MMMM yyyy', { locale: id });

        selectedEmployeeIds.forEach(employeeId => {
            const employee = initialEmployees.find(e => e.id === employeeId);
            if (!employee || !employee.positionDetails) return;

            const attendance = attendanceRecords.find(a => a.employeeId === employeeId);
            const attendanceDays = attendance?.attendanceDays || 0;
            const overtimeHours = attendance?.overtimeHours || 0;
            const bonus = attendance?.bonus || 0;
            const position = employee.positionDetails;

            let earnings: Record<string, number> = {};
            if(position.salaryType === 'bulanan' || position.salaryType === 'direksi') {
                const baseSalary = position.monthlySalary || 0;
                const totalAllowances = position.allowances?.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;
                const totalMonthlySalary = baseSalary + totalAllowances;
                const proratedSalary = (totalMonthlySalary / 30) * attendanceDays;

                earnings.proratedSalary = proratedSalary;
            } else if(position.salaryType === 'harian') {
                earnings = {
                    dailyWage: (position.dailyWage || 0) * attendanceDays,
                    overtime: (position.overtimeRate || 0) * overtimeHours, 
                }
            } else {
                return;
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
            if (attendance?.potonganPph) deductions.potonganPph = attendance.potonganPph;
            if (attendance?.potonganIdCard) deductions.potonganIdCard = attendance.potonganIdCard;
            if (attendance?.potonganSimper) deductions.potonganSimper = attendance.potonganSimper;
            if (attendance?.potonganDenda) deductions.potonganDenda = attendance.potonganDenda;
            const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
            const netSalary = totalEarnings - totalDeductions;
            
            generatedPayslips.push({
                id: employee.id,
                employee,
                period: periodString,
                earnings,
                deductions,
                totalEarnings,
                totalDeductions,
                netSalary,
                position,
                attendanceDays,
                overtimeHours,
                keterangan: keterangan,
                options: payslipOptions,
            });
        });

        if (generatedPayslips.length !== selectedEmployeeIds.size) {
            toast({ variant: 'destructive', title: 'Warning', description: 'Some payslips could not be generated due to missing salary details.' });
        }

        setPayslipsData(generatedPayslips);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Cetak Slip Gaji Kolektif</CardTitle>
          <CardDescription>
            Pilih karyawan dan periode untuk membuat slip gaji secara massal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <Label htmlFor="period">Periode</Label>
                <Input
                    id="period"
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    disabled={isGenerating}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="position-filter">Jabatan</Label>
                <Select value={positionFilter} onValueChange={setPositionFilter} disabled={isGenerating}>
                    <SelectTrigger id="position-filter">
                        <SelectValue placeholder="Filter by position" />
                    </SelectTrigger>
                    <SelectContent>
                        {positions.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                                {pos === 'all' ? 'Semua Jabatan' : pos}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-3 space-y-2">
                <Label>Pilih Karyawan</Label>
                <div className="border rounded-md p-4">
                     <div className="flex items-center space-x-2 pb-2 border-b">
                        <Checkbox
                            id="select-all"
                            onCheckedChange={handleSelectAll}
                            checked={filteredEmployees.length > 0 && selectedEmployeeIds.size === filteredEmployees.length}
                            disabled={isGenerating || filteredEmployees.length === 0}
                        />
                        <Label htmlFor="select-all" className="font-bold">Pilih Semua ({filteredEmployees.length})</Label>
                    </div>
                    <ScrollArea className="h-48">
                        <div className="space-y-2 p-2">
                        {filteredEmployees.map(emp => (
                            <div key={emp.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`emp-${emp.id}`}
                                    onCheckedChange={(checked) => handleSelectEmployee(emp.id, !!checked)}
                                    checked={selectedEmployeeIds.has(emp.id)}
                                    disabled={isGenerating}
                                />
                                <Label htmlFor={`emp-${emp.id}`}>{emp.name}</Label>
                            </div>
                        ))}
                        {filteredEmployees.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">Tidak ada karyawan ditemukan untuk filter ini.</p>
                        )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className="space-y-2 md:col-span-full">
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Textarea 
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tambahkan catatan atau keterangan yang akan diterapkan pada semua slip gaji yang dibuat..."
                disabled={isGenerating}
              />
            </div>
             <Collapsible className="md:col-span-3">
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings2 className="mr-2 h-4 w-4"/>
                        Tampilkan Opsi Tampilan
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="showEmployeeInfo" checked={payslipOptions.showEmployeeInfo} onCheckedChange={(checked) => handleOptionChange('showEmployeeInfo', !!checked)} />
                            <Label htmlFor="showEmployeeInfo" className="cursor-pointer">Info Karyawan</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="showPaymentInfo" checked={payslipOptions.showPaymentInfo} onCheckedChange={(checked) => handleOptionChange('showPaymentInfo', !!checked)} />
                            <Label htmlFor="showPaymentInfo" className="cursor-pointer">Info Pembayaran</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="showSignatures" checked={payslipOptions.showSignatures} onCheckedChange={(checked) => handleOptionChange('showSignatures', !!checked)} />
                            <Label htmlFor="showSignatures" className="cursor-pointer">Tanda Tangan</Label>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Slip Gaji ({selectedEmployeeIds.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {payslipsData.length > 0 && (
        <PayslipViewer 
            payslips={payslipsData}
            settings={settings}
            showControls={true}
        />
      )}
    </div>
  );
}
