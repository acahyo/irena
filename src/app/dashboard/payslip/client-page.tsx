

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
import { Printer, Loader2, Settings2 } from 'lucide-react';
import type { EmployeeWithPosition, AppSettings, Department, AttendanceRecord, Position, KoperasiOrder, HseRecord } from '@/lib/types';
import PayslipViewer, { type PayslipData, type PayslipOptions } from '@/components/payslip-viewer';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getKoperasiOrders } from '@/actions/koperasi';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [koperasiOrders, setKoperasiOrders] = useState<KoperasiOrder[]>([]);
  const [hseRecords, setHseRecords] = useState<HseRecord[]>([]);
  const [keterangan, setKeterangan] = useState('');
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
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
    const fetchData = async () => {
        if (!selectedEmployeeId || !period) {
            setAttendanceRecord(null);
            setKoperasiOrders([]);
            setHseRecords([]);
            return;
        };
        setIsFetching(true);
        try {
            const [attendanceRecords, allKoperasiOrders, allHseRecords] = await Promise.all([
                getAttendanceByPeriod(period),
                getKoperasiOrders({ employeeId: selectedEmployeeId }),
                getHseRecords()
            ]);

            const employeeRecord = attendanceRecords.find(r => r.employeeId === selectedEmployeeId);
            setAttendanceRecord(employeeRecord || null);

            const periodDate = parse(period, 'yyyy-MM', new Date());
            const periodMonth = getMonth(periodDate);
            const periodYear = getYear(periodDate);
            
            const employeeOrders = allKoperasiOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                return getMonth(orderDate) === periodMonth && getYear(orderDate) === periodYear && order.status !== 'Rejected';
            });
            setKoperasiOrders(employeeOrders);
            
            const employeeHseRecords = allHseRecords.filter(r => r.employeeId === selectedEmployeeId && r.hasFine);
            setHseRecords(employeeHseRecords);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance or koperasi data.' });
            setAttendanceRecord(null);
            setKoperasiOrders([]);
        } finally {
            setIsFetching(false);
        }
    };
    fetchData();
  }, [selectedEmployeeId, period, toast]);

  const handleGenerate = async () => {
    if (!selectedEmployeeId || !period || !selectedEmployee) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an employee and a period.',
      });
      return;
    }
    
    if (!selectedEmployee.positionDetails || selectedEmployee.positionDetails.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Salary details for this employee\'s position are not set.',
        });
        return;
    }
    
    // Use the first position as the primary one for display purposes, but calculate earnings from all.
    const primaryPosition = selectedEmployee.positionDetails[0]; 

    const attendanceDays = attendanceRecord?.attendanceByPosition ? Object.values(attendanceRecord.attendanceByPosition).reduce((a, b) => a + (b || 0), 0) : 0;
    const overtimeHours = attendanceRecord?.overtimeByPosition ? Object.values(attendanceRecord.overtimeByPosition).reduce((a, b) => a + (b || 0), 0) : 0;
    const bonus = attendanceRecord?.bonus || 0;

    let earnings: Record<string, number> = {};
    let totalEarnings = 0;

    selectedEmployee.positionDetails.forEach(pos => {
      if (pos.salaryType === 'bulanan' || pos.salaryType === 'direksi') {
          const baseSalary = pos.monthlySalary || 0;

          if (pos.salaryType === 'bulanan') {
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
    if (selectedEmployee.bpjsStatus === 'active' && selectedEmployee.bpjsType && BPJS_RATES[selectedEmployee.bpjsType]) {
        bpjsDeduction = BPJS_RATES[selectedEmployee.bpjsType];
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

    const totalKoperasiSpending = koperasiOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    if (totalKoperasiSpending > 0) {
        deductions.potonganKoperasi = totalKoperasiSpending;
    }
    
    const hseFineDeduction = hseRecords
      .filter(record => record.fineDeductionPeriods && record.fineDeductionPeriods > 0)
      .reduce((sum, record) => {
          const monthlyDeduction = (record.fineAmount || 0) / (record.fineDeductionPeriods || 1);
          return sum + monthlyDeduction;
      }, 0);

    if (hseFineDeduction > 0) {
        deductions.potonganHse = hseFineDeduction;
    }

    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
    const netSalary = totalEarnings - totalDeductions;
    
    const periodDate = parse(period, 'yyyy-MM', new Date());
    const periodString = format(periodDate, 'MMMM yyyy', { locale: id });

    const currentPayslipData: PayslipData = {
      id: selectedEmployee.id,
      employee: selectedEmployee,
      period: periodString,
      earnings,
      deductions,
      totalEarnings,
      totalDeductions,
      netSalary,
      position: primaryPosition,
      attendanceDays: attendanceDays,
      overtimeHours: overtimeHours,
      keterangan: keterangan,
      options: payslipOptions,
    };
    
    setPayslipData(currentPayslipData);
    
    // Save to history
    try {
        await savePayrollRecord({
            employeeId: selectedEmployee.id,
            employeeName: selectedEmployee.name,
            period: period,
            generationDate: new Date(),
            earnings,
            deductions,
            totalEarnings,
            totalDeductions,
            netSalary,
            bankName: selectedEmployee.bankName,
            accountNumber: selectedEmployee.accountNumber,
            keterangan: keterangan,
        });
        toast({
            title: 'Success',
            description: 'Payslip generated and history record saved.',
        });
    } catch(err) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save payroll history record.',
        });
    }
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
                value={attendanceRecord?.attendanceByPosition ? Object.values(attendanceRecord.attendanceByPosition).reduce((a, b) => a + (b || 0), 0) : ''}
                disabled
                placeholder="e.g. 22"
              />
            </div>
             {isClient && selectedEmployee?.positionDetails?.some(p => p.salaryType === 'harian') && (
               <div className="space-y-2">
                <Label htmlFor="overtime">Jumlah Jam Lembur</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={attendanceRecord?.overtimeByPosition ? Object.values(attendanceRecord.overtimeByPosition).reduce((a, b) => a + (b || 0), 0) : ''}
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
                    </div>
                </CollapsibleContent>
            </Collapsible>


          <div className="flex justify-end pt-6">
            <Button onClick={handleGenerate} disabled={isFetching}>
                {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

