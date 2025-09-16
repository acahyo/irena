import { getEmployees } from '@/actions/employees';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ShieldCheck, Contact, WalletCards } from 'lucide-react';

export default async function BpjsIdSimperPage() {
  const employees = await getEmployees();
  const totalEmployees = employees.length;

  // BPJS Stats
  const bpjsActive = employees.filter(e => e.bpjsStatus === 'active');
  const bpjsActiveMiki = bpjsActive.filter(e => e.bpjsType === 'miki').length;
  const bpjsActiveIba = bpjsActive.filter(e => e.bpjsType === 'iba').length;
  const bpjsInactive = employees.filter(e => e.bpjsStatus === 'inactive').length;
  const bpjsNotRegistered = totalEmployees - bpjsActive.length - bpjsInactive;

  // ID Card Stats
  const idCardActive = employees.filter(e => e.idCardNumber).length;
  const idCardNotRegistered = totalEmployees - idCardActive;

  // SIMPER Stats
  const simperActive = employees.filter(e => e.simperNumber).length;
  const simperNotRegistered = totalEmployees - simperActive;

  const StatCard = ({ title, icon, total, details }: { title: string, icon: React.ReactNode, total: number, details?: { label: string, value: number, variant?: "default" | "secondary" | "destructive" | "outline" }[] }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        {details && (
          <div className="mt-2 space-y-2">
            {details.map(detail => (
              <div key={detail.label} className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">{detail.label}</p>
                <Badge variant={detail.variant || 'secondary'}>{detail.value}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
       <Card>
            <CardHeader>
                <CardTitle>Ringkasan BPJS, ID Card, & SIMPER</CardTitle>
                <CardDescription>
                Statistik keseluruhan berdasarkan data karyawan yang terdaftar.
                </CardDescription>
            </CardHeader>
        </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Karyawan"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
        />
        <StatCard
          title="Status BPJS"
          icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
          details={[
            { label: 'Aktif (MIKI)', value: bpjsActiveMiki, variant: 'default' },
            { label: 'Aktif (IBA)', value: bpjsActiveIba, variant: 'default' },
            { label: 'Tidak Aktif', value: bpjsInactive, variant: 'destructive' },
            { label: 'Belum Terdaftar', value: bpjsNotRegistered },
          ]}
        />
        <StatCard
          title="Status ID Card"
          icon={<Contact className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
          details={[
            { label: 'Aktif / Terdaftar', value: idCardActive, variant: 'default' },
            { label: 'Belum Terdaftar', value: idCardNotRegistered },
          ]}
        />
        <StatCard
          title="Status SIMPER"
          icon={<WalletCards className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
          details={[
            { label: 'Aktif / Terdaftar', value: simperActive, variant: 'default' },
            { label: 'Belum Terdaftar', value: simperNotRegistered },
          ]}
        />
      </div>
    </div>
  );
}
