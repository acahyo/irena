
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';
import { saveAttendanceRecord } from '@/actions/attendance';
import { Loader2 } from 'lucide-react';

export default function ProjectAttendanceForm({ employees }: { employees: Employee[] }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [attendance, setAttendance] = useState('');
  const [overtime, setOvertime] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!employee) {
      toast({ variant: 'destructive', title: 'Error', description: 'Karyawan harus dipilih.' });
      return;
    }

    startTransition(async () => {
      try {
        const attendanceData: Record<string, number> = {};
        const overtimeData: Record<string, number> = {};

        // Assuming a single position for simplicity in this quick form
        const primaryPosition = employee.positions?.[0] || 'General';

        if (attendance) {
          attendanceData[primaryPosition] = Number(attendance);
        }
        if (overtime) {
          overtimeData[primaryPosition] = Number(overtime);
        }

        await saveAttendanceRecord({
          employeeId: employee.id,
          employeeName: employee.name,
          period: period,
          attendanceByPosition: attendanceData,
          overtimeByPosition: overtimeData,
        });

        toast({ title: 'Sukses!', description: `Absensi untuk ${employee.name} berhasil disimpan.` });
        // Reset form
        setSelectedEmployeeId('');
        setAttendance('');
        setOvertime('');
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan absensi.' });
      }
    });
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Input Absensi Cepat</CardTitle>
        <CardDescription>Masukkan data kehadiran dan lembur karyawan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee-select">Karyawan</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger id="employee-select">
                <SelectValue placeholder="Pilih Karyawan" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Periode</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={e => setPeriod(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="attendance">Kehadiran (hari)</Label>
              <Input
                id="attendance"
                type="number"
                placeholder="e.g. 26"
                value={attendance}
                onChange={e => setAttendance(e.target.value)}
              />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="overtime">Total Lembur (jam)</Label>
            <Input
              id="overtime"
              type="number"
              placeholder="e.g. 10"
              value={overtime}
              onChange={e => setOvertime(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !selectedEmployeeId}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Absensi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
