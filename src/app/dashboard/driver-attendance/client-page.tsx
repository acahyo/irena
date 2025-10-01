
'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarIcon, Download, Camera, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DriverAttendance } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

export default function DriverAttendanceClientPage({ initialRecords }: { initialRecords: DriverAttendance[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [driverFilter, setDriverFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const recordDate = new Date(rec.timestamp as any);
      const matchesDriver = driverFilter === '' || rec.driverName.toLowerCase().includes(driverFilter.toLowerCase());
      const matchesDate = !dateRange || 
        (recordDate >= (dateRange.from || new Date(0)) && recordDate <= (dateRange.to || new Date()));
      return matchesDriver && matchesDate;
    });
  }, [records, driverFilter, dateRange]);

  const handleExport = () => {
    const dataToExport = filteredRecords.map(rec => ({
      'Tanggal': format(new Date(rec.timestamp as any), 'yyyy-MM-dd'),
      'Jam': format(new Date(rec.timestamp as any), 'HH:mm:ss'),
      'Nama Driver': rec.driverName,
      'Tipe': rec.type,
      'Lokasi': `${rec.latitude}, ${rec.longitude}`,
      'URL Foto': rec.photoUrl,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi Driver');

    worksheet['!cols'] = [
      { wch: 12 }, // Tanggal
      { wch: 10 }, // Jam
      { wch: 25 }, // Nama
      { wch: 10 }, // Tipe
      { wch: 25 }, // Lokasi
      { wch: 50 }, // URL
    ];

    XLSX.writeFile(workbook, 'rekap_absensi_driver.xlsx');
    toast({ title: 'Sukses!', description: 'Data absensi telah diekspor ke file Excel.' });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Rekap Absensi Driver</CardTitle>
            <CardDescription>Pantau dan ekspor semua catatan absensi dari para driver.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Filter nama driver..."
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full md:w-[200px]"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full md:w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleExport} disabled={filteredRecords.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Ekspor
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal & Jam</TableHead>
                <TableHead>Nama Driver</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Foto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map(rec => (
                  <TableRow key={rec.id}>
                    <TableCell>{isClient ? format(new Date(rec.timestamp as any), 'dd MMM yyyy, HH:mm') : 'Loading...'}</TableCell>
                    <TableCell className="font-medium">{rec.driverName}</TableCell>
                    <TableCell>
                      <Badge variant={rec.type === 'check-in' ? 'default' : 'secondary'}>
                        {rec.type === 'check-in' ? 'Masuk' : 'Pulang'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${rec.latitude},${rec.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)} <ExternalLink className="h-3 w-3"/>
                        </a>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button asChild variant="outline" size="sm">
                        <a href={rec.photoUrl} target="_blank" rel="noopener noreferrer">
                          <Camera className="mr-2 h-4 w-4" />
                          Lihat
                        </a>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Tidak ada catatan absensi ditemukan untuk filter yang dipilih.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
