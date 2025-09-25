'use client';

import { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod, saveAttendanceRecord, importAttendanceRecords } from '@/actions/attendance';
import type { EmployeeWithPosition, AttendanceRecord, AppSettings } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

type AttendanceData = {
    [employeeId: string]: {
        attendanceByPosition?: Record<string, number>;
        overtimeByPosition?: Record<string, number>;
        potonganIdCard?: number;
        potonganSimper?: number;
        potonganDenda?: number;
        potonganPph?: number;
        bonus?: number;
    }
}

export default function AttendanceClientPage({
  employees,
  initialAttendance,
  settings,
}: {
  employees: EmployeeWithPosition[];
  initialAttendance: AttendanceRecord[];
  settings: AppSettings;
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [positionFilter, setPositionFilter] = useState('all');
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, startImportTransition] = useTransition();
  const router = useRouter();

  const lang = settings.language || 'id';

  const T = useMemo(() => ({
      title: lang === 'id' ? 'Input Absensi Karyawan' : 'Employee Attendance Input',
      description: lang === 'id' ? 'Masukkan jumlah kehadiran, lembur, dan potongan untuk setiap karyawan. Data disimpan otomatis.' : 'Enter attendance, overtime, and deductions for each employee. Data is saved automatically.',
      filterByPosition: lang === 'id' ? 'Filter berdasarkan jabatan' : 'Filter by position',
      allPositions: lang === 'id' ? 'Semua Jabatan' : 'All Positions',
      import: lang === 'id' ? 'Impor' : 'Import',
      export: lang === 'id' ? 'Ekspor' : 'Export',
      employee: lang === 'id' ? 'Karyawan' : 'Employee',
      position: lang === 'id' ? 'Jabatan' : 'Position',
      attendance: lang === 'id' ? 'Kehadiran' : 'Attendance',
      overtime: lang === 'id' ? 'Lembur' : 'Overtime',
      totalOvertime: lang === 'id' ? 'Total Lembur' : 'Total Overtime',
      bonus: lang === 'id' ? 'Bonus' : 'Bonus',
      idCardDeduction: lang === 'id' ? 'Potongan ID Card' : 'ID Card Deduction',
      simperDeduction: lang === 'id' ? 'Potongan SIMPER' : 'SIMPER Deduction',
      fineDeduction: lang === 'id' ? 'Potongan Denda' : 'Fine Deduction',
      pphDeduction: lang === 'id' ? 'Potongan PPh' : 'PPh Deduction',
      noData: lang === 'id' ? 'Tidak ada data karyawan ditemukan untuk filter ini.' : 'No employee data found for this filter.',
      fetchError: lang === 'id' ? 'Gagal mengambil data absensi untuk periode yang dipilih.' : 'Failed to fetch attendance data for the selected period.',
      saveSuccess: lang === 'id' ? 'Absensi untuk {name} telah diperbarui.' : 'Attendance for {name} has been updated.',
      saveError: lang === 'id' ? 'Gagal menyimpan absensi untuk {name}.' : 'Failed to save attendance for {name}.',
      exportSuccess: lang === 'id' ? 'Data absensi telah diekspor.' : 'Attendance data has been exported.',
      importSuccess: lang === 'id' ? 'Data absensi telah berhasil diimpor.' : 'Attendance data has been imported successfully.',
      importError: lang === 'id' ? 'Gagal menyimpan data yang diimpor ke database.' : 'Failed to save imported data to the database.',
      fileReadError: lang === 'id' ? 'Gagal membaca file Excel.' : 'Failed to read the Excel file.',
      saved: lang === 'id' ? 'Tersimpan!' : 'Saved!',
      error: lang === 'id' ? 'Error' : 'Error',
      importErrorTitle: lang === 'id' ? 'Gagal Impor' : 'Import Error',
      success: lang === 'id' ? 'Sukses!' : 'Success!',

  }), [lang]);


  const positions = useMemo(() => {
    const allPositions = employees.flatMap((emp) => emp.positions || []).filter(Boolean);
    return ['all', ...Array.from(new Set(allPositions as string[]))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (positionFilter === 'all') {
      return employees;
    }
    return employees.filter((emp) => emp.positions?.includes(positionFilter));
  }, [employees, positionFilter]);

  useEffect(() => {
    // Populate initial state from fetched records
    const initialData: AttendanceData = {};
    initialAttendance.forEach(record => {
        initialData[record.employeeId] = {
            attendanceByPosition: record.attendanceByPosition,
            overtimeByPosition: record.overtimeByPosition,
            potonganIdCard: record.potonganIdCard,
            potonganSimper: record.potonganSimper,
            potonganDenda: record.potonganDenda,
            potonganPph: record.potonganPph,
            bonus: record.bonus,
        };
    });
    setAttendanceData(initialData);
  }, [initialAttendance]);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    setIsLoading(true);
    try {
        const records = await getAttendanceByPeriod(newPeriod);
        const newData: AttendanceData = {};
        records.forEach(record => {
            newData[record.employeeId] = {
                attendanceByPosition: record.attendanceByPosition,
                overtimeByPosition: record.overtimeByPosition,
                potonganIdCard: record.potonganIdCard,
                potonganSimper: record.potonganSimper,
                potonganDenda: record.potonganDenda,
                potonganPph: record.potonganPph,
                bonus: record.bonus,
            };
        });
        setAttendanceData(newData);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: T.error,
            description: T.fetchError,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (employeeId: string, field: keyof AttendanceData[string], value: string) => {
      const numericValue = value === '' ? undefined : Number(value);
      setAttendanceData(prev => ({
          ...prev,
          [employeeId]: {
              ...prev[employeeId],
              [field]: numericValue
          }
      }));
  };
  
  const handlePerPositionInputChange = (
    employeeId: string,
    positionName: string,
    field: 'attendanceByPosition' | 'overtimeByPosition',
    value: string
  ) => {
      const numericValue = value === '' ? undefined : Number(value);
      setAttendanceData(prev => {
          const employeeData = prev[employeeId] || {};
          const positionData = employeeData[field] || {};
          return {
              ...prev,
              [employeeId]: {
                  ...employeeData,
                  [field]: {
                      ...positionData,
                      [positionName]: numericValue
                  }
              }
          };
      });
  };

  const handleInputBlur = async (employeeId: string) => {
      const employee = employees.find(e => e.id === employeeId);
      const record = attendanceData[employeeId];
      if (!employee || !record) return;
      
      const hasPerPositionData =
        (record.attendanceByPosition && Object.values(record.attendanceByPosition).some(v => v !== undefined)) ||
        (record.overtimeByPosition && Object.values(record.overtimeByPosition).some(v => v !== undefined));

      const hasOtherData =
        record.potonganIdCard !== undefined || record.potonganSimper !== undefined ||
        record.potonganDenda !== undefined || record.potonganPph !== undefined ||
        record.bonus !== undefined;

      if (!hasPerPositionData && !hasOtherData) {
        return;
      }

      try {
          await saveAttendanceRecord({
              employeeId: employee.id,
              employeeName: employee.name,
              period: period,
              attendanceByPosition: record.attendanceByPosition,
              overtimeByPosition: record.overtimeByPosition,
              potonganIdCard: record.potonganIdCard,
              potonganSimper: record.potonganSimper,
              potonganDenda: record.potonganDenda,
              potonganPph: record.potonganPph,
              bonus: record.bonus,
          });
          toast({
              title: T.saved,
              description: T.saveSuccess.replace('{name}', employee.name),
          });
      } catch (error) {
           toast({
              variant: 'destructive',
              title: T.error,
              description: T.saveError.replace('{name}', employee.name),
          });
      }
  };

  const handleExport = () => {
    // This export format will be complex with multiple positions.
    // For now, let's just show a simple toast message.
    toast({
        title: 'Info',
        description: 'Export with multiple positions is a complex feature and will be implemented later.',
    });
  };

  const handleImportClick = () => {
    // This import format will be complex with multiple positions.
    // For now, let's just show a simple toast message.
    fileInputRef.current?.click();
     toast({
        title: 'Info',
        description: 'Import with multiple positions is a complex feature and will be implemented later.',
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder for now
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{T.title}</CardTitle>
            <CardDescription>
              {T.description}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={T.filterByPosition} />
              </SelectTrigger>
              <SelectContent>
                  {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                          {pos === 'all' ? T.allPositions : pos}
                      </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              id="period"
              type="month"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full md:w-[150px]"
            />
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
                disabled={true}
              />
            <Button variant="outline" onClick={handleImportClick} disabled={true}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {T.import}
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={true}>
              <Download className="mr-2 h-4 w-4" />
              {T.export}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">{T.employee}</TableHead>
              <TableHead>{T.attendance}</TableHead>
              <TableHead>{T.overtime}</TableHead>
              <TableHead>{T.totalOvertime}</TableHead>
              <TableHead className="w-[180px]">{T.bonus}</TableHead>
              <TableHead className="w-[180px]">{T.idCardDeduction}</TableHead>
              <TableHead className="w-[180px]">{T.simperDeduction}</TableHead>
              <TableHead className="w-[180px]">{T.fineDeduction}</TableHead>
              <TableHead className="w-[180px]">{T.pphDeduction}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => {
                const totalOvertime = Object.values(attendanceData[emp.id]?.overtimeByPosition || {}).reduce((sum, hours) => sum + (hours || 0), 0);
                return (
                <TableRow key={emp.id} className="align-top">
                  <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={emp.avatar} alt={emp.name} />
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{emp.name}</div>
                      </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                    {(emp.positions && emp.positions.length > 0) ? (
                        emp.positions.map(posName => {
                           return (
                                <div key={posName} className="space-y-1">
                                    <Label htmlFor={`${emp.id}-${posName}-attendance`} className="text-xs font-normal">{posName} (hari)</Label>
                                    <Input
                                        id={`${emp.id}-${posName}-attendance`}
                                        type="number"
                                        placeholder="e.g. 22"
                                        value={attendanceData[emp.id]?.attendanceByPosition?.[posName] ?? ''}
                                        onChange={(e) => handlePerPositionInputChange(emp.id, posName, 'attendanceByPosition', e.target.value)}
                                        onBlur={() => handleInputBlur(emp.id)}
                                        className="h-8"
                                    />
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-muted-foreground text-xs text-center">-</p>
                    )}
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="space-y-2">
                        {(emp.positionDetails && emp.positionDetails.length > 0) ? (
                            emp.positionDetails.map(posDetail => {
                                const isDaily = posDetail.salaryType === 'harian';
                                if (!isDaily) return null;
                                return (
                                    <div key={posDetail.id} className="space-y-1">
                                        <Label htmlFor={`${emp.id}-${posDetail.name}-overtime`} className="text-xs font-normal">{posDetail.name} (jam)</Label>
                                        <Input
                                            id={`${emp.id}-${posDetail.name}-overtime`}
                                            type="number"
                                            placeholder="e.g. 10"
                                            value={attendanceData[emp.id]?.overtimeByPosition?.[posDetail.name] ?? ''}
                                            onChange={(e) => handlePerPositionInputChange(emp.id, posDetail.name, 'overtimeByPosition', e.target.value)}
                                            onBlur={() => handleInputBlur(emp.id)}
                                            className="h-8"
                                        />
                                    </div>
                                )
                            }).filter(Boolean).length === 0 ? <p className="text-muted-foreground text-xs text-center">-</p> : null
                        ) : (
                            <p className="text-muted-foreground text-xs text-center">-</p>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-center mt-2">{totalOvertime} jam</div>
                  </TableCell>
                   <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g. 500000"
                      value={attendanceData[emp.id]?.bonus ?? ''}
                      onChange={(e) => handleInputChange(emp.id, 'bonus', e.target.value)}
                      onBlur={() => handleInputBlur(emp.id)}
                    />
                  </TableCell>
                   <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={attendanceData[emp.id]?.potonganIdCard ?? ''}
                      onChange={(e) => handleInputChange(emp.id, 'potonganIdCard', e.target.value)}
                      onBlur={() => handleInputBlur(emp.id)}
                    />
                  </TableCell>
                   <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={attendanceData[emp.id]?.potonganSimper ?? ''}
                      onChange={(e) => handleInputChange(emp.id, 'potonganSimper', e.target.value)}
                      onBlur={() => handleInputBlur(emp.id)}
                    />
                  </TableCell>
                   <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g. 100000"
                      value={attendanceData[emp.id]?.potonganDenda ?? ''}
                      onChange={(e) => handleInputChange(emp.id, 'potonganDenda', e.target.value)}
                      onBlur={() => handleInputBlur(emp.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g. 25000"
                      value={attendanceData[emp.id]?.potonganPph ?? ''}
                      onChange={(e) => handleInputChange(emp.id, 'potonganPph', e.target.value)}
                      onBlur={() => handleInputBlur(emp.id)}
                    />
                  </TableCell>
                </TableRow>
              )})
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  {T.noData}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
