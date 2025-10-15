

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ShieldAlert, ClipboardCheck, Target, PlusCircle, Download, FileWarning, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getHseRecords } from '@/actions/hse';
import type { HseRecord, HseCategory } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return null;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};


export default function HsePage() {
  const [allRecords, setAllRecords] = useState<HseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HseRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const records = await getHseRecords();
      setAllRecords(records);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleViewDetails = (record: HseRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };


  const hseData: {
      title: string;
      description: string;
      icon: React.ReactNode;
      category: HseCategory;
      records: HseRecord[];
  }[] = [
    {
      title: 'Laporan Insiden dan Investigasi',
      description: 'Buat SP untuk karyawan berdasarkan laporan insiden yang masuk.',
      icon: <FileWarning className="h-6 w-6 text-destructive" />,
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="space-y-6">
         <Card>
          <CardHeader>
              <CardTitle>Report HSE (Kesehatan, Keselamatan, dan Lingkungan Kerja)</CardTitle>
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
                      {item.records.length > 0 ? item.records.map(record => {
                          const queryParams = record.employeeId ? new URLSearchParams({
                            employeeId: record.employeeId,
                            employeeName: record.employeeName || '',
                            positionName: record.positionName || '',
                            siteLocation: record.siteLocation || ''
                          }).toString() : '';

                          return (
                              <div key={record.id} className="text-sm p-3 border rounded-md transition-colors">
                                  <div className="flex justify-between items-start">
                                      <button onClick={() => handleViewDetails(record)} className="text-left hover:underline">
                                          <p className="font-medium">{record.title}</p>
                                      </button>
                                      {item.category === 'incident' && record.employeeId && (
                                         <Button variant="outline" size="sm" asChild>
                                             <Link href={`/dashboard/violations/new?${queryParams}`}>
                                                 <FileWarning className="mr-2 h-4 w-4" /> Buat SP
                                             </Link>
                                         </Button>
                                      )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">{record.employeeName}</div>
                                  <div className="flex justify-between items-end mt-2 pt-2 border-t">
                                      <div className="text-xs text-muted-foreground">{format(new Date(record.date), 'PPP')}</div>
                                      {record.hasFine && record.fineAmount && (
                                          <div className="text-sm font-semibold text-destructive">{formatCurrency(record.fineAmount)}</div>
                                      )}
                                  </div>
                              </div>
                          );
                      }) : (
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
      
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedRecord && (
           <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Detail Laporan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="text-sm text-muted-foreground">{format(new Date(selectedRecord.date), 'PPP, HH:mm')}</div>
                <p className="text-lg font-bold">{selectedRecord.title}</p>
                
                {selectedRecord.category === 'incident' && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold">Detail Karyawan</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="font-medium">Nama:</div><div>{selectedRecord.employeeName}</div>
                      <div className="font-medium">Lokasi Proyek:</div><div>{selectedRecord.siteLocation}</div>
                      <div className="font-medium">Jabatan:</div><div>{selectedRecord.positionName}</div>
                      {selectedRecord.hasFine && selectedRecord.fineAmount && (
                        <>
                          <div className="font-medium text-destructive">Denda:</div>
                          <div className="font-bold text-destructive">{formatCurrency(selectedRecord.fineAmount)}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold">Deskripsi Laporan</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRecord.description}</p>
                </div>

              </div>
              <DialogFooter>
                  {selectedRecord.fileUrl && (
                     <Button variant="outline" asChild>
                      <a href={selectedRecord.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Unduh Lampiran
                      </a>
                    </Button>
                  )}
                  <Button onClick={() => setIsDetailOpen(false)}>Tutup</Button>
              </DialogFooter>
           </DialogContent>
        )}
      </Dialog>
    </>
  );
}
