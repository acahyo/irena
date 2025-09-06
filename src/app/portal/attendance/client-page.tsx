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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { AttendanceRecord, AppSettings, Employee } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function MyAttendanceClientPage({
  employee,
  initialAttendance,
  settings,
}: {
  employee: Employee;
  initialAttendance: AttendanceRecord[];
  settings: AppSettings;
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(initialAttendance);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lang = settings.language || 'id';

  const T = useMemo(() => ({
      title: lang === 'id' ? 'Data Kehadiran Saya' : 'My Attendance Data',
      description: lang === 'id' ? 'Lihat riwayat kehadiran, lembur, dan potongan Anda per periode.' : 'View your attendance, overtime, and deduction history per period.',
      period: lang === 'id' ? 'Periode' : 'Period',
      attendanceDays: lang === 'id' ? 'Kehadiran (hari)' : 'Attendance (days)',
      overtimeHours: lang === 'id' ? 'Jam Lembur' : 'Overtime Hours',
      bonus: lang === 'id' ? 'Bonus' : 'Bonus',
      idCardDeduction: lang === 'id' ? 'Potongan ID Card' : 'ID Card Deduction',
      simperDeduction: lang === 'id' ? 'Potongan SIMPER' : 'SIMPER Deduction',
      fineDeduction: lang === 'id' ? 'Potongan Denda' : 'Fine Deduction',
      noData: lang === 'id' ? 'Tidak ada data absensi ditemukan untuk periode ini.' : 'No attendance data found for this period.',
      fetchError: lang === 'id' ? 'Gagal mengambil data absensi.' : 'Failed to fetch attendance data.',
      error: lang === 'id' ? 'Error' : 'Error',
  }), [lang]);
  
  useEffect(() => {
    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const records = await getAttendanceByPeriod(period);
            const myRecords = records.filter(r => r.employeeId === employee.id);
            setAttendanceData(myRecords);
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
    fetchAttendance();
  }, [period, employee.id, T.error, T.fetchError, toast]);


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{T.title}</CardTitle>
            <CardDescription>{T.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
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
              <TableHead>{T.period}</TableHead>
              <TableHead>{T.attendanceDays}</TableHead>
              <TableHead>{T.overtimeHours}</TableHead>
              <TableHead>{T.bonus}</TableHead>
              <TableHead>{T.idCardDeduction}</TableHead>
              <TableHead>{T.simperDeduction}</TableHead>
              <TableHead>{T.fineDeduction}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.length > 0 ? (
              attendanceData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell><Badge variant="outline">{record.period}</Badge></TableCell>
                  <TableCell>{record.attendanceDays ?? 0}</TableCell>
                  <TableCell>{record.overtimeHours ?? 0}</TableCell>
                  <TableCell>{record.bonus ?? 0}</TableCell>
                  <TableCell>{record.potonganIdCard ?? 0}</TableCell>
                  <TableCell>{record.potonganSimper ?? 0}</TableCell>
                  <TableCell>{record.potonganDenda ?? 0}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
