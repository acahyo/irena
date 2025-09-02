
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
import type { EmployeeWithPosition, AttendanceRecord } from '@/lib/types';
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
        attendanceDays?: number;
        overtimeHours?: number;
        potonganIdCard?: number;
        potonganSimper?: number;
        potonganDenda?: number;
        bonus?: number;
    }
}

export default function AttendanceClientPage({
  employees,
  initialAttendance,
}: {
  employees: EmployeeWithPosition[];
  initialAttendance: AttendanceRecord[];
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [positionFilter, setPositionFilter] = useState('all');
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, startImportTransition] = useTransition();
  const router = useRouter();


  const positions = useMemo(() => {
    const allPositions = employees.map((emp) => emp.position).filter(Boolean);
    return ['all', ...Array.from(new Set(allPositions as string[]))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (positionFilter === 'all') {
      return employees;
    }
    return employees.filter((emp) => emp.position === positionFilter);
  }, [employees, positionFilter]);

  useEffect(() => {
    // Populate initial state from fetched records
    const initialData: AttendanceData = {};
    initialAttendance.forEach(record => {
        initialData[record.employeeId] = {
            attendanceDays: record.attendanceDays,
            overtimeHours: record.overtimeHours,
            potonganIdCard: record.potonganIdCard,
            potonganSimper: record.potonganSimper,
            potonganDenda: record.potonganDenda,
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
                attendanceDays: record.attendanceDays,
                overtimeHours: record.overtimeHours,
                potonganIdCard: record.potonganIdCard,
                potonganSimper: record.potonganSimper,
                potonganDenda: record.potonganDenda,
                bonus: record.bonus,
            };
        });
        setAttendanceData(newData);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to fetch attendance data for the selected period.',
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

  const handleInputBlur = async (employeeId: string) => {
      const employee = employees.find(e => e.id === employeeId);
      const record = attendanceData[employeeId];
      if (!employee || !record) return;

      // Only save if there's actual data to save
      if (
        record.attendanceDays === undefined && record.overtimeHours === undefined &&
        record.potonganIdCard === undefined && record.potonganSimper === undefined &&
        record.potonganDenda === undefined && record.bonus === undefined
      ) {
        return;
      }

      try {
          await saveAttendanceRecord({
              employeeId: employee.id,
              employeeName: employee.name,
              period: period,
              attendanceDays: record.attendanceDays,
              overtimeHours: record.overtimeHours,
              potonganIdCard: record.potonganIdCard,
              potonganSimper: record.potonganSimper,
              potonganDenda: record.potonganDenda,
              bonus: record.bonus,
          });
          toast({
              title: 'Saved!',
              description: `Attendance for ${employee.name} has been updated.`,
          });
      } catch (error) {
           toast({
              variant: 'destructive',
              title: 'Error',
              description: `Failed to save attendance for ${employee.name}.`,
          });
      }
  };

  const handleExport = () => {
    const dataToExport = filteredEmployees.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        period: period,
        attendanceDays: attendanceData[emp.id]?.attendanceDays ?? 0,
        overtimeHours: attendanceData[emp.id]?.overtimeHours ?? 0,
        bonus: attendanceData[emp.id]?.bonus ?? 0,
        potonganIdCard: attendanceData[emp.id]?.potonganIdCard ?? 0,
        potonganSimper: attendanceData[emp.id]?.potonganSimper ?? 0,
        potonganDenda: attendanceData[emp.id]?.potonganDenda ?? 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `absensi_${period}.xlsx`);
    toast({
      title: 'Success!',
      description: 'Attendance data has been exported.',
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          const recordsToImport: Omit<AttendanceRecord, 'id'>[] = json.map(row => {
            const employee = employees.find(emp => emp.id === row.employeeId);
            return {
                employeeId: row.employeeId,
                employeeName: employee?.name || 'Unknown Employee',
                period: row.period || period,
                attendanceDays: row.attendanceDays ? Number(row.attendanceDays) : undefined,
                overtimeHours: row.overtimeHours ? Number(row.overtimeHours) : undefined,
                bonus: row.bonus ? Number(row.bonus) : undefined,
                potonganIdCard: row.potonganIdCard ? Number(row.potonganIdCard) : undefined,
                potonganSimper: row.potonganSimper ? Number(row.potonganSimper) : undefined,
                potonganDenda: row.potonganDenda ? Number(row.potonganDenda) : undefined,
            }
          }).filter(record => record.employeeId); // Ensure employeeId exists

          startImportTransition(async () => {
            try {
              await importAttendanceRecords(recordsToImport);
              toast({
                title: 'Success!',
                description: 'Attendance data has been imported successfully.',
              });
              // Refetch data for the current period to update the view
              await handlePeriodChange(period);
            } catch (importError) {
               toast({
                variant: "destructive",
                title: 'Import Error',
                description: 'Failed to save imported data to the database.',
              });
            }
          });

        } catch (error) {
          console.error("Error reading file:", error);
           toast({
            variant: "destructive",
            title: 'File Read Error',
            description: 'Failed to read the Excel file.',
          });
        } finally {
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Input Absensi Karyawan</CardTitle>
            <CardDescription>
              Masukkan jumlah kehadiran, lembur, dan potongan untuk setiap karyawan. Data disimpan otomatis.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
                disabled={isImporting}
              />
            <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
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
              <TableHead>Karyawan</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead className="w-[180px]">Kehadiran (hari)</TableHead>
              <TableHead className="w-[180px]">Jam Lembur</TableHead>
              <TableHead className="w-[180px]">Bonus</TableHead>
              <TableHead className="w-[180px]">Potongan ID Card</TableHead>
              <TableHead className="w-[180px]">Potongan SIMPER</TableHead>
              <TableHead className="w-[180px]">Potongan Denda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={emp.avatar} alt={emp.name} />
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{emp.name}</div>
                      </div>
                  </TableCell>
                  <TableCell>{emp.position || 'N/A'}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g. 22"
                      value={attendanceData[emp.id]?.attendanceDays ?? ''}
                      onChange={(e) => handleInputChange(emp.id, 'attendanceDays', e.target.value)}
                      onBlur={() => handleInputBlur(emp.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {emp.positionDetails?.salaryType === 'harian' ? (
                        <Input
                          type="number"
                          placeholder="e.g. 10"
                          value={attendanceData[emp.id]?.overtimeHours ?? ''}
                          onChange={(e) => handleInputChange(emp.id, 'overtimeHours', e.target.value)}
                          onBlur={() => handleInputBlur(emp.id)}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground text-center">-</p>
                    )}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Tidak ada data karyawan ditemukan untuk filter ini.
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
