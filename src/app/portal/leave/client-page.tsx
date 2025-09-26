'use client';

import { useState, useMemo, useTransition } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { LeaveRequest, AppSettings, Employee } from '@/lib/types';
import { createLeaveRequest } from '@/actions/leave';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';


const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Approved':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function MyLeaveClientPage({ 
    initialRequests, 
    employee, 
    settings 
}: { 
    initialRequests: LeaveRequest[], 
    employee: Employee,
    settings: AppSettings
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const lang = settings.language || 'id';

  const T = useMemo(() => ({
    title: lang === 'id' ? 'Jadwal Cuti Saya' : 'Cuti Saya',
    description: lang === 'id' ? 'Lihat riwayat dan ajukan cuti baru di sini.' : 'Lihat riwayat dan ajukan cuti baru.',
    requestLeave: lang === 'id' ? 'Ajukan Cuti' : 'Ajukan Cuti',
    startDate: lang === 'id' ? 'Tanggal Mulai' : 'Tanggal Mulai',
    endDate: lang === 'id' ? 'Tanggal Selesai' : 'Tanggal Selesai',
    leaveType: lang === 'id' ? 'Jenis Cuti' : 'Jenis Cuti',
    reason: lang === 'id' ? 'Alasan' : 'Alasan',
    status: lang === 'id' ? 'Status' : 'Status',
    noRequests: lang === 'id' ? 'Tidak ada riwayat cuti.' : 'Tidak ada riwayat cuti.',
    requestSuccess: lang === 'id' ? 'Pengajuan cuti berhasil dikirim.' : 'Pengajuan cuti berhasil diajukan.',
    requestError: lang === 'id' ? 'Gagal mengirim pengajuan cuti.' : 'Gagal mengirim pengajuan cuti.',
    error: lang === 'id' ? 'Error' : 'Error',
    success: lang === 'id' ? 'Sukses!' : 'Sukses!',
    newLeaveTitle: lang === 'id' ? 'Formulir Pengajuan Cuti' : 'Formulir Pengajuan Cuti',
    newLeaveDesc: lang === 'id' ? 'Isi formulir di bawah ini untuk mengajukan cuti.' : 'Isi formulir di bawah ini untuk mengajukan cuti.',
    submit: lang === 'id' ? 'Kirim' : 'Ajukan',
    cancel: lang === 'id' ? 'Batal' : 'Batal',
    submitting: lang === 'id' ? 'Mengirim...' : 'Mengirim...',
  }), [lang]);
  
  const NewLeaveForm = () => {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!startDate || !endDate) {
            toast({ variant: 'destructive', title: T.error, description: 'Please fill out all required fields.' });
            return;
        }

        startTransition(async () => {
            const formData = new FormData(event.currentTarget);
            const leaveData = {
              employeeId: employee.id,
              employeeName: employee.name,
              startDate: startDate,
              endDate: endDate,
              type: formData.get('type') as any,
              reason: formData.get('reason') as string,
            };

            try {
                await createLeaveRequest(leaveData);
                toast({ title: T.success, description: T.requestSuccess });
                setIsDialogOpen(false);
                router.push('/portal/leave'); // Navigate to refresh the data reliably
                router.refresh(); 
            } catch (error) {
                toast({ variant: 'destructive', title: T.error, description: T.requestError });
            }
        });
    }
    
    const DatePicker = ({ date, setDate, placeholder }: { date: Date | undefined, setDate: (d: Date | undefined) => void, placeholder: string }) => (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
        </Popover>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="type">{T.leaveType}</Label>
                <Select name="type" required>
                    <SelectTrigger id="type"><SelectValue placeholder="Pilih Jenis Cuti" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Annual Leave">Cuti Tahunan</SelectItem>
                        <SelectItem value="Sick Leave">Cuti Sakit</SelectItem>
                        <SelectItem value="Unpaid Leave">Cuti Tidak Dibayar</SelectItem>
                        <SelectItem value="Other">Lainnya</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{T.startDate}</Label>
                    <DatePicker date={startDate} setDate={setStartDate} placeholder="Pilih tanggal" />
                </div>
                <div className="space-y-2">
                    <Label>{T.endDate}</Label>
                    <DatePicker date={endDate} setDate={setEndDate} placeholder="Pilih tanggal" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reason">{T.reason}</Label>
                <Textarea id="reason" name="reason" placeholder="Jelaskan alasan cuti..." required />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{T.cancel}</Button></DialogClose>
                <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isPending ? T.submitting : T.submit}
                </Button>
            </DialogFooter>
        </form>
    );
  };


  return (
    <>
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{T.title}</CardTitle>
              <CardDescription>{T.description}</CardDescription>
            </div>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {T.requestLeave}
                </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{T.startDate}</TableHead>
                <TableHead>{T.endDate}</TableHead>
                <TableHead>{T.leaveType}</TableHead>
                <TableHead>{T.reason}</TableHead>
                <TableHead>{T.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRequests.length > 0 ? (
                initialRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.startDate as string}</TableCell>
                    <TableCell>{req.endDate as string}</TableCell>
                    <TableCell>{req.type}</TableCell>
                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">{T.noRequests}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{T.newLeaveTitle}</DialogTitle>
                <DialogDescription>{T.newLeaveDesc}</DialogDescription>
            </DialogHeader>
            <NewLeaveForm />
        </DialogContent>
     </Dialog>
    </>
  );
}
