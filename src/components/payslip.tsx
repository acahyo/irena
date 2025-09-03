

import type { Employee, AppSettings, Position } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { PayslipData } from './payslip-viewer';


// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper to format period
const formatPeriod = (period: string) => {
    const date = new Date(`${period}-02`); // Use day 2 to avoid timezone issues
    return format(date, 'MMMM yyyy', { locale: id });
}

// Helper to format salary labels
const formatLabel = (key: string, employee: Employee, attendanceDays?: number, overtimeHours?: number) => {
    const bpjsLabel = employee.bpjsType ? `Iuran BPJS (${employee.bpjsType.toUpperCase()})` : "Iuran BPJS";
    
    const labels: Record<string, string> = {
        monthlySalary: "Gaji Pokok",
        dailyWage: `Gaji Harian (${attendanceDays ?? '...'} hari)`,
        overtime: `Lembur (${overtimeHours ?? '...'} jam)`,
        tax: "Pajak (PPH 21)",
        bpjs: bpjsLabel,
        potonganIdCard: "Potongan ID Card",
        potonganSimper: "Potongan SIMPER",
        potonganDenda: "Potongan Denda/Panjar",
        bonus: "Bonus",
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
}


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
            <h2 className="text-3xl font-bold uppercase text-primary">Slip Gaji</h2>
            <p className="text-gray-500">Periode: {formatPeriod(period)}</p>
          </div>
        </header>
        
        {(options.showEmployeeInfo || options.showPaymentInfo) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {options.showEmployeeInfo && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Karyawan</h3>
                <div className="grid grid-cols-2 gap-4">
                      <DetailRow label="Nama" value={employee.name} />
                      <DetailRow label="NIK" value={employee.nik} />
                      <DetailRow label="Jabatan" value={employee.position} />
                      <DetailRow label="Departemen" value={employee.department} />
                      <DetailRow label="Lokasi/Site" value={employee.siteLocation} />
                      <DetailRow label="Status" value={employee.employeeStatus} />
                      {attendanceDays !== undefined && <DetailRow label="Total Kehadiran" value={`${attendanceDays} hari`} />}
                      {employee.bpjsStatus === 'active' && <DetailRow label="Tipe BPJS" value={employee.bpjsType?.toUpperCase()} />}
                </div>
              </div>
            )}
            {options.showPaymentInfo && (
              <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Pembayaran</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <DetailRow label="Tanggal Pembayaran" value={format(new Date(), 'dd MMMM yyyy', { locale: id })} />
                      <DetailRow label="Bank" value={employee.bankName} />
                      <DetailRow label="No. Rekening" value={employee.accountNumber} />
                      <DetailRow label="Nama Pemilik" value={employee.accountHolderName} />
                  </div>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">Penghasilan</h3>
            <div className="divide-y">
              {Object.entries(earnings).map(([key, value]) => (
                  <SalaryRow key={key} label={formatLabel(key, employee, attendanceDays, overtimeHours)} value={value} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">Potongan</h3>
            <div className="divide-y">
              {Object.keys(deductions).length > 0 ? Object.entries(deductions).map(([key, value]) => (
                <SalaryRow key={key} label={formatLabel(key, employee)} value={value} />
              )) : <p className="text-gray-500 text-sm py-2">Tidak ada potongan.</p>}
            </div>
          </div>
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="flex justify-between font-bold text-lg py-2 bg-gray-100 px-4 rounded">
              <p>Total Penghasilan</p>
              <p>{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="flex justify-between font-bold text-lg py-2 bg-gray-100 px-4 rounded">
              <p>Total Potongan</p>
              <p>{formatCurrency(totalDeductions)}</p>
          </div>
        </section>

        <section className="mt-8 bg-primary text-primary-foreground p-6 rounded-lg text-center">
          <h3 className="text-xl uppercase tracking-wider">Gaji Bersih (Take Home Pay)</h3>
          <p className="text-4xl font-bold mt-2">{formatCurrency(netSalary)}</p>
        </section>

        {keterangan && (
            <section className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700">Keterangan:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{keterangan}</p>
            </section>
        )}
        
        {options.showSignatures && (
           <section className="grid grid-cols-2 gap-8 mt-12 pt-8">
                <div className="text-center">
                    <p className="mb-16">Diterima oleh,</p>
                    <p className="font-bold border-t pt-2">{employee.name}</p>
                    <p className="text-sm text-gray-500">Karyawan</p>
                </div>
                 <div className="text-center">
                    <p className="mb-16">Disetujui oleh,</p>
                    <p className="font-bold border-t pt-2">(___________________)</p>
                    <p className="text-sm text-gray-500">Manajer/Direktur</p>
                </div>
            </section>
        )}


        <footer className="mt-12 text-center text-xs text-gray-400">
          <p>Ini adalah slip gaji yang dibuat secara otomatis oleh sistem.</p>
          <p>{settings.appName} &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
