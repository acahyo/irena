'use client';

import * as React from 'react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2 } from 'lucide-react';
import Payslip from '@/components/payslip';
import type { EmployeeWithPosition, AppSettings, Position, AttendanceRecord } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PayslipOptions {
  showEmployeeInfo?: boolean;
  showPaymentInfo?: boolean;
  showSignatures?: boolean;
}

export interface PayslipData {
  id: string;
  employee: EmployeeWithPosition;
  position: Position;
  period: string;
  paymentDate?: Date;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  attendanceDays?: number;
  overtimeHours?: number;
  keterangan?: string;
  options?: PayslipOptions;
}

interface PayslipViewerProps {
  payslips: PayslipData[];
  settings: AppSettings;
  showControls?: boolean;
}

export default function PayslipViewer({
  payslips,
  settings,
  showControls = false,
}: PayslipViewerProps) {
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const payslipRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handlePrint = () => {
    setIsPrinting(true);
    // Use a timeout to allow the loading state to render before the print dialog blocks the main thread
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 100);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 0; i < payslips.length; i++) {
        const payslipElement = payslipRefs.current[i];
        if (payslipElement) {
            const canvas = await html2canvas(payslipElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            if (i > 0) {
                pdf.addPage();
            }
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pdfHeight;
            }
        }
    }
    
    pdf.save(`payslips-${payslips[0]?.period || 'collective'}.pdf`);
    setIsDownloading(false);
  };


  if (!payslips || payslips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {showControls && (
         <div className="flex justify-center gap-4 print:hidden">
            <Button onClick={handlePrint} disabled={isPrinting || isDownloading}>
                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {payslips.length > 1 ? 'Cetak Semua' : 'Cetak'}
            </Button>
            <Button onClick={handleDownload} disabled={isPrinting || isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {payslips.length > 1 ? 'Unduh Semua (PDF)' : 'Unduh PDF'}
            </Button>
        </div>
      )}
      <div className="space-y-8">
        {payslips.map((data, index) => (
           <div key={data.id} ref={el => payslipRefs.current[index] = el}>
            <Payslip
              data={data}
              settings={settings}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
