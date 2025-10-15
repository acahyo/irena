

'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Employee, PayrollRecord, PaymentRequest, PurchaseRequest } from '@/lib/types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

export default function ReportsClientPage({
  employees,
  payrollHistory,
  paymentRequests,
  purchaseRequests,
}: {
  employees: Employee[];
  payrollHistory: PayrollRecord[];
  paymentRequests: PaymentRequest[];
  purchaseRequests: PurchaseRequest[];
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [isDownloading, startDownload] = useTransition();
  const { toast } = useToast();

  const handleDownloadFinancialReport = () => {
    startDownload(() => {
      try {
        const reportPeriod = format(new Date(period + '-02'), 'MMMM yyyy');
        
        // Payroll Data
        const payrollForPeriod = payrollHistory.filter(p => p.period === period);
        const payrollData = payrollForPeriod.map(p => ({
          'Karyawan': p.employeeName,
          'Bank': p.bankName || '-',
          'No. Rekening': p.accountNumber || '-',
          'Gaji Bersih': p.netSalary,
        }));
        
        // Payment Requests Data
        const paymentsForPeriod = paymentRequests.filter(p => p.requestDate.toString().startsWith(period));
        const paymentData = paymentsForPeriod.map(p => ({
          'Pemohon': p.requesterName,
          'Kategori': p.category,
          'Nama Pembayaran': p.paymentName,
          'Jumlah': p.amount,
        }));

        // Purchase Requests Data
        const purchasesForPeriod = purchaseRequests.filter(p => p.requestDate.toString().startsWith(period));
        const purchaseData = purchasesForPeriod.map(p => ({
          'Proyek': p.projectName,
          'Pemohon': p.requesterName,
          'Status': p.status,
          'Nominal': p.proposedAmount || 0,
        }));
        
        const wb = XLSX.utils.book_new();
        const wsPayroll = XLSX.utils.json_to_sheet(payrollData);
        const wsPayments = XLSX.utils.json_to_sheet(paymentData);
        const wsPurchases = XLSX.utils.json_to_sheet(purchaseData);

        XLSX.utils.book_append_sheet(wb, wsPayroll, 'Gaji');
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Pengajuan Pembayaran');
        XLSX.utils.book_append_sheet(wb, wsPurchases, 'Pengadaan Barang');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Laporan_Keuangan_${reportPeriod}.xlsx`);

        toast({ title: 'Sukses!', description: 'Laporan keuangan berhasil diunduh.' });
      } catch (error) {
        console.error(error)
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal membuat laporan keuangan.' });
      }
    });
  };

  const handleDownloadManpowerReport = () => {
     startDownload(() => {
      try {
        const reportDate = format(new Date(), 'yyyy-MM-dd');

        const manpowerByProject = employees.reduce((acc, emp) => {
          const project = emp.siteLocation || 'Unassigned';
          if (!acc[project]) acc[project] = 0;
          acc[project]++;
          return acc;
        }, {} as Record<string, number>);

        const manpowerByPosition = employees.reduce((acc, emp) => {
          const position = emp.position || 'Unassigned';
          if (!acc[position]) acc[position] = 0;
          acc[position]++;
          return acc;
        }, {} as Record<string, number>);

        const projectData = Object.entries(manpowerByProject).map(([project, count]) => ({ 'Proyek': project, 'Jumlah Karyawan': count }));
        const positionData = Object.entries(manpowerByPosition).map(([position, count]) => ({ 'Jabatan': position, 'Jumlah Karyawan': count }));

        const wb = XLSX.utils.book_new();
        const wsProject = XLSX.utils.json_to_sheet(projectData);
        const wsPosition = XLSX.utils.json_to_sheet(positionData);

        XLSX.utils.book_append_sheet(wb, wsProject, 'Per Proyek');
        XLSX.utils.book_append_sheet(wb, wsPosition, 'Per Jabatan');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Laporan_Manpower_${reportDate}.xlsx`);
        
        toast({ title: 'Sukses!', description: 'Laporan manpower berhasil diunduh.' });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal membuat laporan manpower.' });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Keuangan</CardTitle>
          <CardDescription>Unduh ringkasan semua pengeluaran dalam satu periode dalam format Excel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finance-period">Pilih Periode</Label>
            <Input id="finance-period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <Button onClick={handleDownloadFinancialReport} className="w-full" disabled={isDownloading}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Unduh Laporan Keuangan (Excel)
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Laporan Manpower</CardTitle>
          <CardDescription>Unduh rekapitulasi data karyawan dalam format Excel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Laporan ini akan berisi data karyawan dari semua proyek yang terdaftar saat ini.</p>
          <Button onClick={handleDownloadManpowerReport} className="w-full" disabled={isDownloading}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Unduh Laporan Manpower (Excel)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
