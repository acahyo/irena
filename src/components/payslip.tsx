
'use client';

import type { Employee, AppSettings, Position } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import type { PayslipData } from './payslip-viewer';


// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function Payslip({
  data,
  settings,
}: {
  data: PayslipData;
  settings: AppSettings;
}) {
  const {
    employee,
    period,
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary,
    attendanceDays,
    overtimeHours,
    keterangan,
    options = { showEmployeeInfo: true, showPaymentInfo: true, showSignatures: true },
  } = data;
  
  const lang = settings.language || 'id';
  const locale = lang === 'id' ? id : enUS;

  // Helper to format salary labels
  const formatLabel = (key: string) => {
      const bpjsLabel = employee.bpjsType ? `Iuran BPJS (${employee.bpjsType.toUpperCase()})` : "Iuran BPJS";
      
      const labelsId: Record<string, string> = {
          potonganPph: "Pajak (PPH 21)",
          bpjs: bpjsLabel,
          potonganIdCard: "Potongan ID Card",
          potonganSimper: "Potongan SIMPER",
          potonganDenda: "Potongan Denda/Panjar",
          bonus: "Bonus",
      };
      
      const labelsEn: Record<string, string> = {
          potonganPph: "Tax (PPH 21)",
          bpjs: `BPJS Contribution (${employee.bpjsType?.toUpperCase() || ''})`,
          potonganIdCard: "ID Card Deduction",
          potonganSimper: "SIMPER Deduction",
          potonganDenda: "Fine/Advance Deduction",
          bonus: "Bonus",
      };
      
      if (key.startsWith('dailyWage-')) {
          const positionName = key.replace('dailyWage-', '');
          const attendanceForPos = data.attendanceDays || '...';
          return lang === 'id' ? `Upah Harian - ${positionName}` : `Daily Wage - ${positionName}`;
      }
      if (key.startsWith('overtime-')) {
          const positionName = key.replace('overtime-', '');
           const overtimeForPos = data.overtimeHours || '...';
          return lang === 'id' ? `Lembur - ${positionName}` : `Overtime - ${positionName}`;
      }


      const labels = lang === 'id' ? labelsId : labelsEn;
      return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
  }

  const T = {
    payslipTitle: lang === 'id' ? 'Slip Gaji' : 'Payslip',
    periodLabel: lang === 'id' ? 'Periode' : 'Period',
    employeeInfo: lang === 'id' ? 'Informasi Karyawan' : 'Employee Information',
    name: lang === 'id' ? 'Nama' : 'Name',
    nik: lang === 'id' ? 'NIK' : 'Employee ID',
    position: lang === 'id' ? 'Jabatan' : 'Position',
    department: lang === 'id' ? 'Departemen' : 'Department',
    site: lang === 'id' ? 'Lokasi/Site' : 'Site Location',
    status: lang === 'id' ? 'Status' : 'Status',
    attendance: lang === 'id' ? 'Total Kehadiran' : 'Total Attendance',
    days: lang === 'id' ? 'hari' : 'days',
    bpjsType: lang === 'id' ? 'Tipe BPJS' : 'BPJS Type',
    paymentInfo: lang === 'id' ? 'Informasi Pembayaran' : 'Payment Information',
    paymentDate: lang === 'id' ? 'Tanggal Pembayaran' : 'Payment Date',
    bank: lang === 'id' ? 'Bank' : 'Bank',
    accountNumber: lang === 'id' ? 'No. Rekening' : 'Account Number',
    accountHolder: lang === 'id' ? 'Nama Pemilik' : 'Account Holder Name',
    earnings: lang === 'id' ? 'Penghasilan' : 'Earnings',
    deductions: lang === 'id' ? 'Potongan' : 'Deductions',
    noDeductions: lang === 'id' ? 'Tidak ada potongan.' : 'No deductions.',
    totalEarnings: lang === 'id' ? 'Total Penghasilan' : 'Total Earnings',
    totalDeductions: lang === 'id' ? 'Total Potongan' : 'Total Deductions',
    netPay: lang === 'id' ? 'Gaji Bersih (Take Home Pay)' : 'Net Salary (Take Home Pay)',
    notes: lang === 'id' ? 'Keterangan:' : 'Notes:',
    receivedBy: lang === 'id' ? 'Diterima oleh,' : 'Received by,',
    approvedBy: lang === 'id' ? 'Disetujui oleh,' : 'Approved by,',
    employee: lang === 'id' ? 'Karyawan' : 'Employee',
    manager: lang === 'id' ? 'Manajer/Direktur' : 'Manager/Director',
    footer: lang === 'id' ? 'Ini adalah slip gaji yang dibuat secara otomatis oleh sistem.' : 'This is a system-generated payslip.',
  };


  const DetailRow = ({ label, value }: { label: string; value: string | undefined | number }) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
  
  const SalaryRow = ({ label, value }: { label: string; value: number }) => (
     <div className="flex justify-between py-2">
        <p>{label}</p>
        <p>{formatCurrency(value)}</p>
      </div>
  )

  return (
    <div id="payslip" className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto border print:shadow-none print:border-none print:break-after-page">
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; }
          .print-container {
             break-inside: avoid;
          }
        `}
      </style>
      <div className="print-container">
        <header className="flex items-center justify-between pb-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage src={settings.logo} alt={settings.appName} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                {settings.appName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{settings.appName}</h1>
              <p className="text-gray-500">{settings.appDescription}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold uppercase text-primary">{T.payslipTitle}</h2>
            <p className="text-gray-500">{T.periodLabel}: {period}</p>
          </div>
        </header>
        
        {(options.showEmployeeInfo || options.showPaymentInfo) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {options.showEmployeeInfo && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{T.employeeInfo}</h3>
                <div className="grid grid-cols-2 gap-4">
                      <DetailRow label={T.name} value={employee.name} />
                      <DetailRow label={T.nik} value={employee.nik} />
                      <DetailRow label={T.position} value={employee.positions?.join(', ')} />
                      <DetailRow label={T.department} value={employee.department} />
                      <DetailRow label={T.site} value={employee.siteLocation} />
                      <DetailRow label={T.status} value={employee.employeeStatus} />
                      {attendanceDays !== undefined && <DetailRow label={T.attendance} value={`${attendanceDays} ${T.days}`} />}
                      {employee.bpjsStatus === 'active' && <DetailRow label={T.bpjsType} value={employee.bpjsType?.toUpperCase()} />}
                </div>
              </div>
            )}
            {options.showPaymentInfo && (
              <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{T.paymentInfo}</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <DetailRow label={T.paymentDate} value={format(new Date(), 'dd MMMM yyyy', { locale })} />
                      <DetailRow label={T.bank} value={employee.bankName} />
                      <DetailRow label={T.accountNumber} value={employee.accountNumber} />
                      <DetailRow label={T.accountHolder} value={employee.accountHolderName} />
                  </div>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">{T.earnings}</h3>
            <div className="divide-y">
              {Object.entries(earnings).map(([key, value]) => (
                  <SalaryRow key={key} label={formatLabel(key)} value={value} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">{T.deductions}</h3>
            <div className="divide-y">
              {Object.keys(deductions).length > 0 ? Object.entries(deductions).map(([key, value]) => (
                <SalaryRow key={key} label={formatLabel(key)} value={value} />
              )) : <p className="text-gray-500 text-sm py-2">{T.noDeductions}</p>}
            </div>
          </div>
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="flex justify-between font-bold text-lg py-2 bg-gray-100 px-4 rounded">
              <p>{T.totalEarnings}</p>
              <p>{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="flex justify-between font-bold text-lg py-2 bg-gray-100 px-4 rounded">
              <p>{T.totalDeductions}</p>
              <p>{formatCurrency(totalDeductions)}</p>
          </div>
        </section>

        <section className="mt-8 bg-primary text-primary-foreground p-6 rounded-lg text-center">
          <h3 className="text-xl uppercase tracking-wider">{T.netPay}</h3>
          <p className="text-4xl font-bold mt-2">{formatCurrency(netSalary)}</p>
        </section>

        {keterangan && (
            <section className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700">{T.notes}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{keterangan}</p>
            </section>
        )}
        
        {options.showSignatures && (
           <section className="grid grid-cols-2 gap-8 mt-12 pt-8">
                <div className="text-center">
                    <p className="mb-16">{T.receivedBy}</p>
                    <p className="font-bold border-t pt-2">{employee.name}</p>
                    <p className="text-sm text-gray-500">{T.employee}</p>
                </div>
                 <div className="text-center">
                    <p className="mb-16">{T.approvedBy}</p>
                    <p className="font-bold border-t pt-2">(___________________)</p>
                    <p className="text-sm text-gray-500">{T.manager}</p>
                </div>
            </section>
        )}


        <footer className="mt-12 text-center text-xs text-gray-400">
          <p>{T.footer}</p>
          <p>{settings.appName} &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
