import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ShieldAlert, ClipboardCheck, Target, PlusCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { getHseRecords } from '@/actions/hse';
import type { HseRecord, HseCategory } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';


export default async function HsePage() {
  const allRecords = await getHseRecords();

  const hseData: {
      title: string;
      description: string;
      icon: React.ReactNode;
      category: HseCategory;
      records: HseRecord[];
  }[] = [
    {
      title: 'Laporan Insiden dan Investigasi',
      description: 'Laporan insiden, kecelakaan, dan hasil investigasi.',
      icon: <ShieldAlert className="h-6 w-6 text-destructive" />,
      category: 'incident',
      records: allRecords.filter(r => r.category === 'incident'),
    },
    {
      title: 'Dokumentasi Inspeksi dan Audit',
      description: 'Hasil inspeksi rutin, audit K3, dan temuan.',
      icon: <ClipboardCheck className="h-6 w-6 text-blue-500" />,
      category: 'inspection',
      records: allRecords.filter(r => r.category === 'inspection'),
    },
    {
      title: 'Data Manajemen Risiko',
      description: 'Identifikasi bahaya, penilaian risiko, dan tindakan pengendalian.',
      icon: <FileText className="h-6 w-6 text-yellow-500" />,
      category: 'risk',
      records: allRecords.filter(r => r.category === 'risk'),
    },
    {
      title: 'Rencana Kerja dan Program K3',
      description: 'Program, target, dan rencana kerja K3 yang sedang berjalan.',
      icon: <Target className="h-6 w-6 text-green-500" />,
      category: 'plan',
      records: allRecords.filter(r => r.category === 'plan'),
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
          <Card key={item.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{item.icon}</div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href={`/dashboard/hse/new?category=${item.category}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah
                </Link>
            </Button>
            </CardHeader>
            <CardContent className="flex-grow">
              <ScrollArea className="h-48 pr-4">
                <div className="space-y-3">
                    {item.records.length > 0 ? item.records.map(record => (
                        <div key={record.id} className="text-sm p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium">{record.title}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(record.date), 'PPP')}</p>
                            </div>
                            {record.fileUrl && (
                               <Button asChild variant="ghost" size="icon">
                                 <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                                   <Download className="h-4 w-4" />
                                 </a>
                               </Button>
                            )}
                        </div>
                    )) : (
                        <div className="flex items-center justify-center text-center h-48 rounded-lg border-2 border-dashed text-muted-foreground">
                            <p>Data belum tersedia.</p>
                        </div>
                    )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}