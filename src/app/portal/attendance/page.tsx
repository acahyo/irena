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
import MyAttendanceClientPage from './client-page';


export default function MyAttendancePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [initialAttendance, setInitialAttendance] = useState<AttendanceRecord[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [session, appSettings] = await Promise.all([getEmployeeSession(), getSettings()]);
        if (!session?.id) {
            setError("Session not found. Redirecting to login.");
            window.location.href = '/login/employee';
            return;
        }

        const emp = await getEmployee(session.id);
        if (!emp) {
          setError("Employee not found. Redirecting to login.");
          window.location.href = '/login/employee';
          return;
        }

        const currentPeriod = new Date().toISOString().slice(0, 7);
        const allAttendance = await getAttendanceByPeriod(currentPeriod);
        
        const employeeAttendance = allAttendance
            .filter(rec => rec.employeeId === session.id)
            .map(rec => ({
              ...rec,
              date: rec.date ? new Date(rec.date).toISOString() : new Date().toISOString(),
            }));

        setEmployee(emp);
        setSettings(appSettings);
        setInitialAttendance(employeeAttendance as AttendanceRecord[]);
      } catch (err) {
        console.error("Failed to fetch initial data for attendance page:", err);
        setError("Failed to load page data.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex justify-center items-center h-64">
            <p className="text-destructive">{error}</p>
        </div>
    )
  }

  if (!employee || !settings) {
      return null;
  }

  return (
    <MyAttendanceClientPage
      employee={employee}
      initialAttendance={initialAttendance}
      settings={settings}
    />
  );
}
