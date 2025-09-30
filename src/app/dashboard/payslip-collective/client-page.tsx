

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
import type { EmployeeWithPosition, AppSettings, AttendanceRecord, Position, KoperasiOrder, HseRecord } from '@/lib/types';
import PayslipViewer, { type PayslipData, type PayslipOptions } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getKoperasiOrders } from '@/actions/koperasi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { format, parse, getMonth, getYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { savePayrollRecord } from '@/actions/payroll';
import { getHseRecords } from '@/actions/hse';

const BPJS_RATES: Record<string, number> = {
    miki: 280000,
    iba: 322000,
};

export default function PayslipCollectiveClientPage({
  initialEmployees,
  settings,
}: {
  initialEmployees: EmployeeWithPosition[];
  settings: AppSettings;
}) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [positionFilter, setPositionFilter] = useState('all');
  const [payslipsData, setPayslipsData] = useState<PayslipData[]>([]);
  const [keterangan, setKeterangan] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [koperasiOrders, setKoperasiOrders] = useState<KoperasiOrder[]>([]);
  const [hseRecords, setHseRecords] = useState<HseRecord[]>([]);
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
      .flatMap((emp) => emp.positions || [])
      .filter(Boolean);
    return ['all', ...Array.from(new Set(allPositions as string[]))];
  }, [initialEmployees]);

  const filteredEmployees = useMemo(() => {
    let employees = initialEmployees.filter(emp => emp.canGeneratePayslip !== false);
    if (positionFilter === 'all') {
      return employees;
    }
    return employees.filter((emp) => emp.positions?.includes(positionFilter));
  }, [initialEmployees, positionFilter]);

  useEffect(() => {
    const fetchPeriodData = async () => {
        if (!period) return;
        startTransition(async () => {
            try {
                const [attendanceData, koperasiData, allHseRecords] = await Promise.all([
                  getAttendanceByPeriod(period),
                  getKoperasiOrders({}),
                  getHseRecords()
                ]);
                setAttendanceRecords(attendanceData);
                
                const periodDate = parse(period, 'yyyy-MM', new Date());
                const periodMonth = getMonth(periodDate);
                const periodYear = getYear(periodDate);

                const relevantOrders = koperasiData.filter(order => {
                  const orderDate = new Date(order.orderDate);
                  return getMonth(orderDate) === periodMonth && getYear(orderDate) === periodYear && order.status !== 'Rejected';
                });
                setKoperasiOrders(relevantOrders);

                setHseRecords(allHseRecords.filter(r => r.hasFine));

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data for the selected period.' });
            }
        });
    };
    fetchPeriodData();
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

    startTransition(async () => {
        const generatedPayslips: PayslipData[] = [];
        const periodDate = parse(period, 'yyyy-MM', new Date());
        const periodString = format(periodDate, 'MMMM yyyy', { locale: id });
        let savedCount = 0;

        for (const employeeId of selectedEmployeeIds) {
            const employee = initialEmployees.find(e => e.id === employeeId);
            if (!employee || !employee.positionDetails || employee.positionDetails.length === 0) continue;

            const attendance = attendanceRecords.find(a => a.employeeId === employeeId);
            const attendanceDays = attendance?.attendanceByPosition ? Object.values(attendance.attendanceByPosition).reduce((a, b) => a + (b || 0), 0) : 0;
            const overtimeHours = attendance?.overtimeByPosition ? Object.values(attendance.overtimeByPosition).reduce((a, b) => a + (b || 0), 0) : 0;
            const bonus = attendance?.bonus || 0;
            
            let totalEarnings = 0;
            const earnings: Record<string, number> = {};

            employee.positionDetails!.forEach(position => {
                if (position.salaryType === 'bulanan' || position.salaryType === 'direksi') {
                    const baseSalary = position.monthlySalary || 0;

                    if (position.salaryType === 'bulanan') {
                        const dailyRate = baseSalary / 30;
                        const calculatedSalary = dailyRate * attendanceDays;
                        earnings[`Gaji Pokok - ${position.name}`] = calculatedSalary;
                        totalEarnings += calculatedSalary;
                    } else { // Direksi
                        earnings[position.name] = baseSalary;
                        totalEarnings += baseSalary;
                    }

                    position.allowances?.forEach(allowance => {
                        earnings[allowance.name] = allowance.amount;
                        totalEarnings += allowance.amount;
                    });
                } else if(position.salaryType === 'harian') {
                    const attendanceForPos = attendance?.attendanceByPosition?.[position.name] || 0;
                    const overtimeForPos = attendance?.overtimeByPosition?.[position.name] || 0;
                    
                    if (attendanceForPos > 0) {
                      const dailyIncome = (position.dailyWage || 0) * attendanceForPos;
                      earnings[`dailyWage-${position.name}`] = dailyIncome;
                      totalEarnings += dailyIncome;
                    }
                    
                    if (overtimeForPos > 0) {
                      const overtimeIncome = (position.overtimeRate || 0) * overtimeForPos;
                      earnings[`overtime-${position.name}`] = overtimeIncome;
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
            if (attendance?.potonganPph) deductions.potonganPph = attendance.potonganPph;
            if (attendance?.potonganIdCard) deductions.potonganIdCard = attendance.potonganIdCard;
            if (attendance?.potonganSimper) deductions.potonganSimper = attendance.potonganSimper;
            if (attendance?.potonganDenda) deductions.potonganDenda = attendance.potonganDenda;
            
            const totalKoperasiSpending = koperasiOrders
                .filter(order => order.employeeId === employeeId)
                .reduce((sum, order) => sum + order.totalPrice, 0);

            if (totalKoperasiSpending > 0) {
                deductions.potonganKoperasi = totalKoperasiSpending;
            }
            
            const hseFineDeduction = hseRecords
              .filter(record => record.employeeId === employeeId && record.fineDeductionPeriods && record.fineDeductionPeriods > 0)
              .reduce((sum, record) => {
                  const monthlyDeduction = (record.fineAmount || 0) / (record.fineDeductionPeriods || 1);
                  return sum + monthlyDeduction;
              }, 0);

            if (hseFineDeduction > 0) {
                deductions.potonganHse = hseFineDeduction;
            }

            const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
            const netSalary = totalEarnings - totalDeductions;
            
            const mainPosition = employee.positionDetails![0];
            
            const payslipRecord: Omit<PayslipData, 'employee'> = {
                id: employee.id,
                period: periodString,
                earnings,
                deductions,
                totalEarnings,
                totalDeductions,
                netSalary,
                position: mainPosition,
                attendanceDays,
                overtimeHours,
                keterangan: keterangan,
                options: payslipOptions,
            };

            generatedPayslips.push({ ...payslipRecord, employee });

            // Save to history
            try {
                await savePayrollRecord({
                    ...payslipRecord,
                    period: period,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    bankName: employee.bankName,
                    accountNumber: employee.accountNumber,
                });
                savedCount++;
            } catch (err) {
                 // Log error but continue
                console.error(`Failed to save payroll record for ${employee.name}`, err);
            }
        }

        if (generatedPayslips.length !== selectedEmployeeIds.size) {
            toast({ variant: 'destructive', title: 'Warning', description: 'Some payslips could not be generated due to missing salary details.' });
        }
        
        toast({
            title: 'Success!',
            description: `${generatedPayslips.length} payslips generated and ${savedCount} history records saved.`,
        });

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

