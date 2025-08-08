
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getEmployees } from '@/actions/employees';
import { createLeaveRequest } from '@/actions/leave';
import type { Employee } from '@/lib/types';

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  useEffect(() => {
    const fetchEmployees = async () => {
        const fetchedEmployees = await getEmployees();
        setEmployees(fetchedEmployees);
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedEmployee || !startDate || !endDate) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please fill out all required fields.',
        });
        return;
    }
    
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const employee = employees.find(e => e.id === selectedEmployee);
    
    const leaveData = {
      employeeId: selectedEmployee,
      employeeName: employee?.name || '',
      startDate: startDate,
      endDate: endDate,
      type: formData.get('type') as 'Annual Leave' | 'Sick Leave' | 'Unpaid Leave' | 'Other',
      reason: formData.get('reason') as string,
    };
    
    try {
        await createLeaveRequest(leaveData);
        toast({
            title: 'Success!',
            description: 'New leave request has been submitted.',
        });
        router.push('/dashboard/leave-schedule');
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to submit leave request.',
        });
    } finally {
        setLoading(false);
    }
  };

  const DatePicker = ({
    date,
    setDate,
    placeholder
  }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/leave-schedule">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave Schedule
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Ajukan Cuti Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah ini untuk mengajukan cuti karyawan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                  <Label htmlFor="employee">Karyawan</Label>
                   <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Pilih Karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Jenis Cuti</Label>
                <Select name="type" required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Pilih Jenis Cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">Cuti Tahunan</SelectItem>
                    <SelectItem value="Sick Leave">Cuti Sakit</SelectItem>
                    <SelectItem value="Unpaid Leave">Cuti Tidak Dibayar</SelectItem>
                    <SelectItem value="Other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <DatePicker date={startDate} setDate={setStartDate} placeholder="Pilih tanggal mulai" />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <DatePicker date={endDate} setDate={setEndDate} placeholder="Pilih tanggal selesai" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">Alasan</Label>
                <Textarea id="reason" name="reason" placeholder="Jelaskan alasan cuti..." required />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ajukan Cuti
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
