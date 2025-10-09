'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Employee, PayrollRecord, PaymentRequest, PurchaseRequest } from '@/lib/types';

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
    startDownload(async () => {
      try {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        
        const doc = new jsPDF();
        const reportDate = format(new Date(), 'dd MMMM yyyy');
        const reportPeriod = format(new Date(period + '-02'), 'MMMM yyyy');

        // Header
        doc.setFontSize(18);
        doc.text('Laporan Keuangan Profesional', 14, 22);
        doc.setFontSize(11);
        doc.text(`Periode: ${reportPeriod}`, 14, 30);
        doc.text(`Tanggal Cetak: ${reportDate}`, 14, 36);

        let finalY = 45;

        // Payroll
        const payrollForPeriod = payrollHistory.filter(p => p.period === period);
        if (payrollForPeriod.length > 0) {
          doc.setFontSize(14);
          doc.text('Pengeluaran Gaji', 14, finalY);
          finalY += 5;
          autoTable(doc, {
            startY: finalY,
            head: [['Karyawan', 'Bank', 'No. Rekening', 'Gaji Bersih']],
            body: payrollForPeriod.map(p => [p.employeeName, p.bankName || '-', p.accountNumber || '-', formatCurrency(p.netSalary)]),
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
          });
          finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Payment Requests
        const paymentsForPeriod = paymentRequests.filter(p => p.requestDate.toString().startsWith(period));
        if (paymentsForPeriod.length > 0) {
          doc.setFontSize(14);
          doc.text('Pengajuan Pembayaran', 14, finalY);
          finalY += 5;
          autoTable(doc, {
            startY: finalY,
            head: [['Pemohon', 'Kategori', 'Nama Pembayaran', 'Jumlah']],
            body: paymentsForPeriod.map(p => [p.requesterName, p.category, p.paymentName, formatCurrency(p.amount)]),
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
          });
          finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Purchase Requests
        const purchasesForPeriod = purchaseRequests.filter(p => p.requestDate.toString().startsWith(period));
        if (purchasesForPeriod.length > 0) {
          doc.setFontSize(14);
          doc.text('Pengadaan Barang', 14, finalY);
          finalY += 5;
          autoTable(doc, {
            startY: finalY,
            head: [['Proyek', 'Pemohon', 'Status', 'Nominal']],
            body: purchasesForPeriod.map(p => [p.projectName, p.requesterName, p.status, formatCurrency(p.proposedAmount || 0)]),
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
          });
        }
        
        doc.save(`Laporan_Keuangan_${period}.pdf`);
        toast({ title: 'Sukses!', description: 'Laporan keuangan berhasil diunduh.' });
      } catch (error) {
        console.error(error)
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal membuat laporan keuangan.' });
      }
    });
  };

  const handleDownloadManpowerReport = () => {
     startDownload(async () => {
      try {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const reportDate = format(new Date(), 'dd MMMM yyyy');
        
        // Header
        doc.setFontSize(18);
        doc.text('Laporan Manpower Profesional', 14, 22);
        doc.setFontSize(11);
        doc.text(`Tanggal Cetak: ${reportDate}`, 14, 30);

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

        let finalY = 40;

        doc.setFontSize(14);
        doc.text('Rekapitulasi per Proyek', 14, finalY);
        finalY += 5;
        autoTable(doc, {
          startY: finalY,
          head: [['Proyek', 'Jumlah Karyawan']],
          body: Object.entries(manpowerByProject).map(([project, count]) => [project, count]),
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFontSize(14);
        doc.text('Rekapitulasi per Jabatan', 14, finalY);
        finalY += 5;
        autoTable(doc, {
          startY: finalY,
          head: [['Jabatan', 'Jumlah Karyawan']],
          body: Object.entries(manpowerByPosition).map(([position, count]) => [position, count]),
        });

        doc.save(`Laporan_Manpower_${reportDate}.pdf`);
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
          <CardDescription>Unduh ringkasan semua pengeluaran dalam satu periode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finance-period">Pilih Periode</Label>
            <Input id="finance-period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <Button onClick={handleDownloadFinancialReport} className="w-full" disabled={isDownloading}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Unduh Laporan Keuangan
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Laporan Manpower</CardTitle>
          <CardDescription>Unduh rekapitulasi data karyawan berdasarkan proyek dan jabatan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Laporan ini akan berisi data karyawan dari semua proyek yang terdaftar saat ini.</p>
          <Button onClick={handleDownloadManpowerReport} className="w-full" disabled={isDownloading}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Unduh Laporan Manpower
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
