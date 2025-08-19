
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod, saveAttendanceRecord } from '@/actions/attendance';
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

type AttendanceData = {
    [employeeId: string]: {
        attendanceDays?: number;
        overtimeHours?: number;
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
            overtimeHours: record.overtimeHours
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
                overtimeHours: record.overtimeHours
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

  const handleInputChange = (employeeId: string, field: 'attendanceDays' | 'overtimeHours', value: string) => {
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
      if (record.attendanceDays === undefined && record.overtimeHours === undefined) {
        return;
      }

      try {
          await saveAttendanceRecord({
              employeeId: employee.id,
              employeeName: employee.name,
              period: period,
              attendanceDays: record.attendanceDays,
              overtimeHours: record.overtimeHours,
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


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Input Absensi Karyawan</CardTitle>
            <CardDescription>
              Masukkan jumlah kehadiran dan lembur untuk setiap karyawan. Data disimpan otomatis.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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
              className="w-full md:w-[180px]"
            />
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
              <TableHead>Tipe Gaji</TableHead>
              <TableHead className="w-[180px]">Jumlah Kehadiran (hari)</TableHead>
              <TableHead className="w-[180px]">Jumlah Jam Lembur</TableHead>
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
                    {emp.positionDetails?.salaryType ? (
                      <Badge variant="outline" className="capitalize">{emp.positionDetails.salaryType}</Badge>
                    ) : (
                      <Badge variant="destructive">Not Set</Badge>
                    )}
                   </TableCell>
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
