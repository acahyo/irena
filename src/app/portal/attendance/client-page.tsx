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
import { getEmployeeSession } from '@/actions/auth';
import { getSettings } from '@/actions/settings';
import { getEmployee } from '@/actions/employees';
import { useRouter } from 'next/navigation';


export default function MyAttendanceClientPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();


  const lang = settings?.language || 'id';

  const T = useMemo(() => ({
      title: lang === 'id' ? 'Data Kehadiran Saya' : 'My Attendance Data',
      description: lang === 'id' ? 'Lihat riwayat kehadiran dan lembur Anda per periode.' : 'View your attendance and overtime history per period.',
      period: lang === 'id' ? 'Periode' : 'Period',
      position: lang === 'id' ? 'Jabatan' : 'Position',
      attendanceDays: lang === 'id' ? 'Kehadiran (hari)' : 'Attendance (days)',
      overtimeHours: lang === 'id' ? 'Jam Lembur' : 'Overtime Hours',
      noData: lang === 'id' ? 'Tidak ada data absensi ditemukan untuk periode ini.' : 'No attendance data found for this period.',
      fetchError: lang === 'id' ? 'Gagal mengambil data absensi.' : 'Failed to fetch attendance data.',
      error: lang === 'id' ? 'Error' : 'Error',
      pageError: lang === 'id' ? 'Gagal memuat data halaman.' : 'Failed to load page data.',
  }), [lang]);
  
   useEffect(() => {
    const fetchInitialData = async () => {
      setPageLoading(true);
      try {
        const [session, appSettings] = await Promise.all([getEmployeeSession(), getSettings()]);
        if (!session?.id) {
          router.push('/login/employee');
          return;
        }

        const emp = await getEmployee(session.id);
        if (!emp) {
          router.push('/login/employee');
          return;
        }

        setEmployee(emp);
        setSettings(appSettings);
      } catch (err) {
        console.error("Failed to fetch initial data for attendance page:", err);
        toast({ variant: 'destructive', title: T.error, description: T.pageError });
      } finally {
        setPageLoading(false);
      }
    };

    fetchInitialData();
  }, [router, T.error, T.pageError, toast]);


  useEffect(() => {
    if (!employee) return;
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
  }, [period, employee, T.error, T.fetchError, toast]);

  const flattenedAttendance = useMemo(() => {
    const flatData: { period: string, position: string, attendance: number, overtime: number }[] = [];
    attendanceData.forEach(record => {
      const positions = new Set([
          ...Object.keys(record.attendanceByPosition || {}), 
          ...Object.keys(record.overtimeByPosition || {})
      ]);
      
      if (positions.size === 0) {
        // Handle case where there's a record but no per-position data (e.g., only bonus/deductions)
        // We can choose to show a row with 0 attendance/overtime or hide it.
        // Let's hide it to keep the table clean, as the user only asked for these columns.
      } else {
        positions.forEach(pos => {
            flatData.push({
                period: record.period,
                position: pos,
                attendance: record.attendanceByPosition?.[pos] || 0,
                overtime: record.overtimeByPosition?.[pos] || 0
            });
        });
      }
    });
    return flatData;
  }, [attendanceData]);
  
  if (pageLoading || !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <TableHead>{T.position}</TableHead>
              <TableHead>{T.attendanceDays}</TableHead>
              <TableHead>{T.overtimeHours}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedAttendance.length > 0 ? (
              flattenedAttendance.map((item, index) => (
                <TableRow key={`${item.period}-${item.position}-${index}`}>
                  <TableCell><Badge variant="outline">{item.period}</Badge></TableCell>
                  <TableCell>{item.position}</TableCell>
                  <TableCell>{item.attendance}</TableCell>
                  <TableCell>{item.overtime}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
