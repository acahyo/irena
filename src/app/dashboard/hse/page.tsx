import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ShieldAlert, ClipboardCheck, Target } from 'lucide-react';

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
            <CardTitle>Dasbor HSE (Kesehatan, Keselamatan, dan Lingkungan Kerja)</CardTitle>
            <CardDescription>
            Pusat informasi untuk semua data terkait K3 di lingkungan kerja.
            </CardDescription>
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
