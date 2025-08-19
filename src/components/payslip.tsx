
import type { Employee, AppSettings, Position } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PayslipData {
  employee: Employee;
  position: Position;
  period: string;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
}

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
const formatLabel = (key: string) => {
    const labels: Record<string, string> = {
        monthlySalary: "Gaji Pokok Bulanan",
        otAllowance: "Tunjangan OT & Kehadiran",
        locationAllowance: "Tunjangan Lokasi",
        mealAllowance: "Tunjangan Makan",
        otherAllowances: "Tunjangan Lain-lain",
        dailyWage: "Gaji Harian (Total)",
        overtime: "Lembur (Total)",
    };
    return labels[key] || key;
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
  } = data;

  const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
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
    <div id="payslip" className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto border print:shadow-none print:border-none">
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0; }
          body { background-color: #fff; }
          #payslip { margin: 0; border: initial; border-radius: initial; width: initial; min-height: initial; box-shadow: initial; background: initial; page-break-after: always; }
        `}
      </style>
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

      <section className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Karyawan</h3>
           <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Nama" value={employee.name} />
                <DetailRow label="NIK" value={employee.nik} />
                <DetailRow label="Jabatan" value={employee.position} />
                <DetailRow label="Departemen" value={employee.department} />
                <DetailRow label="Lokasi/Site" value={employee.siteLocation} />
                <DetailRow label="Status" value={employee.employeeStatus} />
           </div>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Pembayaran</h3>
            <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Tanggal Pembayaran" value={format(new Date(), 'dd MMMM yyyy', { locale: id })} />
                <DetailRow label="Bank" value={employee.bankName} />
                <DetailRow label="No. Rekening" value={employee.accountNumber} />
                 <DetailRow label="Nama Pemilik" value={employee.accountHolderName} />
            </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-8 mt-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">Penghasilan</h3>
          <div className="divide-y">
            {Object.entries(earnings).map(([key, value]) => (
                <SalaryRow key={key} label={formatLabel(key)} value={value} />
            ))}
          </div>
        </div>
        <div>
           <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">Potongan</h3>
          <div className="divide-y">
            <SalaryRow label="Pajak (PPH 21)" value={deductions.tax} />
            <SalaryRow label="Iuran BPJS" value={deductions.bpjs} />
          </div>
        </div>
      </section>
      
       <section className="grid grid-cols-2 gap-8 mt-4">
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

      <footer className="mt-12 text-center text-xs text-gray-400">
        <p>Ini adalah slip gaji yang dibuat secara otomatis oleh sistem.</p>
        <p>{settings.appName} &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
