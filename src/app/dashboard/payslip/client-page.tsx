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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Printer, Loader2, Settings2, Calendar as CalendarIcon } from 'lucide-react';
import type { EmployeeWithPosition, AppSettings, Department, AttendanceRecord } from '@/lib/types';
import PayslipViewer, { type PayslipData, type PayslipOptions } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';


const BPJS_RATES: Record<string, number> = {
    miki: 280000,
    iba: 322000,
};

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
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [applyPph, setApplyPph] = useState(true);
  const { toast } = useToast();
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [payslipOptions, setPayslipOptions] = useState<PayslipOptions>({
    showEmployeeInfo: true,
    showPaymentInfo: true,
    showSignatures: true,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleOptionChange = (option: keyof PayslipOptions, value: boolean) => {
    setPayslipOptions(prev => ({ ...prev, [option]: value }));
  };

  const filteredEmployees = useMemo(() => {
    let employees = initialEmployees.filter(emp => emp.canGeneratePayslip !== false);
    if (departmentFilter === 'all') {
        return employees;
    }
    return employees.filter(emp => emp.department === departmentFilter);
  }, [initialEmployees, departmentFilter]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return initialEmployees.find((e) => e.id === selectedEmployeeId) || null;
  }, [selectedEmployeeId, initialEmployees]);
  
  useEffect(() => {
    if (selectedEmployeeId && !filteredEmployees.find(e => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(null);
        setPayslipData(null);
    }
  }, [filteredEmployees, selectedEmployeeId]);

  useEffect(() => {
    const fetchAttendance = async () => {
        if (!selectedEmployeeId || !startDate) {
            setAttendanceRecord(null);
            return;
        };
        const period = format(startDate, 'yyyy-MM');
        setIsFetchingAttendance(true);
        try {
            const record = await getAttendanceByPeriod(period);
            const employeeRecord = record.find(r => r.employeeId === selectedEmployeeId);
            setAttendanceRecord(employeeRecord || null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance data.' });
            setAttendanceRecord(null);
        } finally {
            setIsFetchingAttendance(false);
        }
    };
    fetchAttendance();
  }, [selectedEmployeeId, startDate, toast]);

  const handleGenerate = () => {
    if (!selectedEmployeeId || !startDate || !endDate || !selectedEmployee) {
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
    if (selectedEmployee.bpjsStatus === 'active' && selectedEmployee.bpjsType && BPJS_RATES[selectedEmployee.bpjsType]) {
        bpjsDeduction = BPJS_RATES[selectedEmployee.bpjsType];
    }
    if (bpjsDeduction > 0) {
      deductions.bpjs = bpjsDeduction;
    }

    if (applyPph) {
      deductions.tax = totalEarnings * 0.02;
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
    
    const periodString = `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;

    setPayslipData({
      id: selectedEmployee.id,
      employee: selectedEmployee,
      period: periodString,
      earnings,
      deductions,
      totalEarnings,
      totalDeductions,
      netSalary,
      position,
      attendanceDays: attendanceDays,
      overtimeHours: overtimeHours,
      keterangan: keterangan,
      options: payslipOptions,
    });
  };
  
    const DatePicker = ({ date, setDate, label }: { date: Date | undefined, setDate: (d: Date | undefined) => void, label: string }) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
            </Popover>
        </div>
    );

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
             <div className="grid grid-cols-2 gap-4">
                 <DatePicker date={startDate} setDate={setStartDate} label="Tanggal Mulai" />
                 <DatePicker date={endDate} setDate={setEndDate} label="Tanggal Selesai" />
             </div>
             <div className="space-y-2">
              <Label htmlFor="attendance">Jumlah Kehadiran (hari)</Label>
              <Input
                id="attendance"
                type="number"
                value={attendanceRecord?.attendanceDays || ''}
                disabled
                placeholder="e.g. 22"
              />
            </div>
             {isClient && selectedEmployee?.positionDetails?.salaryType === 'harian' && (
               <div className="space-y-2">
                <Label htmlFor="overtime">Jumlah Jam Lembur</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={attendanceRecord?.overtimeHours || ''}
                  disabled
                  placeholder="e.g. 10"
                />
              </div>
            )}
             <div className="space-y-2 md:col-span-full">
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Textarea 
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tambahkan catatan atau keterangan tambahan untuk slip gaji ini..."
              />
            </div>
          </div>
          
           <Collapsible className="mt-6">
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
                         <div className="flex items-center space-x-2">
                            <Checkbox id="apply-pph" checked={applyPph} onCheckedChange={(checked) => setApplyPph(Boolean(checked))} />
                            <Label htmlFor="apply-pph" className="cursor-pointer">Potongan PPH 21 (2%)</Label>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>


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
