import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ShieldAlert, ClipboardCheck, Target, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function HsePage() {
  const hseData = [
    {
      title: 'Laporan Insiden dan Investigasi',
      description: 'Laporan insiden, kecelakaan, dan hasil investigasi.',
      icon: <ShieldAlert className="h-6 w-6 text-destructive" />,
    },
    {
      title: 'Dokumentasi Inspeksi dan Audit',
      description: 'Hasil inspeksi rutin, audit K3, dan temuan.',
      icon: <ClipboardCheck className="h-6 w-6 text-blue-500" />,
    },
    {
      title: 'Data Manajemen Risiko',
      description: 'Identifikasi bahaya, penilaian risiko, dan tindakan pengendalian.',
      icon: <FileText className="h-6 w-6 text-yellow-500" />,
    },
    {
      title: 'Rencana Kerja dan Program K3',
      description: 'Program, target, dan rencana kerja K3 yang sedang berjalan.',
      icon: <Target className="h-6 w-6 text-green-500" />,
    },
  ];

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Dasbor HSE (Kesehatan, Keselamatan, dan Lingkungan Kerja)</CardTitle>
                    <CardDescription>
                    Pusat informasi untuk semua data terkait K3 di lingkungan kerja.
                    </CardDescription>
                </div>
                <Button asChild>
                    <Link href="/dashboard/hse/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Data HSE
                    </Link>
                </Button>
            </div>
        </CardHeader>
       </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {hseData.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex-shrink-0">{item.icon}</div>
              <div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed text-muted-foreground">
                <p>Data belum tersedia.</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
