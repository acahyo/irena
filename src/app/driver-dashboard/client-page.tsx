
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, Send, Loader2, Clock } from 'lucide-react';
import type { Employee, DriverAttendance, Vehicle } from '@/lib/types';
import { submitDriverAttendance, submitP2hReport, submitUnitConditionReport } from '@/actions/driver';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


export default function DriverDashboardClient({ employee, initialHistory, vehicles }: { employee: Employee, initialHistory: DriverAttendance[], vehicles: Vehicle[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Attendance state
  const [attendanceType, setAttendanceType] = useState<'check-in' | 'check-out'>('check-in');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const [isClient, setIsClient] = useState(false);

  // P2H state
  const [p2hUnit, setP2hUnit] = useState('');
  const [p2hHourMeter, setP2hHourMeter] = useState('');
  const [p2hNotes, setP2hNotes] = useState('');

  // Unit Condition state
  const [conditionUnit, setConditionUnit] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');

   useEffect(() => {
    setIsClient(true);
    
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationError(null);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Gagal mendapatkan lokasi. Pastikan izin lokasi telah diberikan.');
          }
        );
      } else {
        setLocationError('Geolocation tidak didukung oleh browser ini.');
      }
    };

    getCameraPermission();
    getLocation();
  }, []);

  const handleAttendanceSubmit = () => {
    if (!location) {
        toast({ variant: 'destructive', title: 'Error', description: 'Lokasi tidak ditemukan.' });
        return;
    }
    if (!videoRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'Kamera tidak siap.' });
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengambil gambar.' });
        return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    startTransition(async () => {
      const result = await submitDriverAttendance({
        driverId: employee.id,
        driverName: employee.name,
        type: attendanceType,
        latitude: location.latitude,
        longitude: location.longitude,
        photoDataUri,
      });

      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        // Add new record to the top of the history
        const newRecord: DriverAttendance = {
            id: new Date().toISOString(), // Temporary ID
            driverId: employee.id,
            driverName: employee.name,
            timestamp: new Date().toISOString() as any,
            type: attendanceType,
            latitude: location.latitude,
            longitude: location.longitude,
            photoUrl: photoDataUri, // Show temporary local preview
        };
        setHistory(prev => [newRecord, ...prev]);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleP2hSubmit = () => {
    if (!p2hUnit || !p2hHourMeter) {
        toast({ variant: 'destructive', title: 'Error', description: 'Unit dan HM Wajib diisi.' });
        return;
    }
    startTransition(async () => {
        const result = await submitP2hReport({
            driverId: employee.id,
            driverName: employee.name,
            unitId: p2hUnit,
            hourMeter: Number(p2hHourMeter),
            notes: p2hNotes,
        });

         if (result.success) {
            toast({ title: 'Sukses', description: result.message });
            setP2hUnit('');
            setP2hHourMeter('');
            setP2hNotes('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  };

  const handleConditionSubmit = () => {
      if (!conditionUnit || !conditionNotes) {
        toast({ variant: 'destructive', title: 'Error', description: 'Unit dan Catatan wajib diisi.' });
        return;
    }
     startTransition(async () => {
        const result = await submitUnitConditionReport({
            driverId: employee.id,
            driverName: employee.name,
            unitId: conditionUnit,
            notes: conditionNotes,
        });

         if (result.success) {
            toast({ title: 'Sukses', description: result.message });
            setConditionUnit('');
            setConditionNotes('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang, {employee.name}</CardTitle>
          <CardDescription>Dasbor khusus untuk Driver LV Office.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Attendance Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Absensi</CardTitle>
            <CardDescription>Absen masuk atau pulang kerja dari lokasi Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {isClient && !hasCameraPermission && (
                <Alert variant="destructive">
                    <AlertTitle>Kamera Tidak Dapat Diakses</AlertTitle>
                    <AlertDescription>Mohon izinkan akses kamera di browser Anda untuk menggunakan fitur absensi.</AlertDescription>
                </Alert>
             )}
             {isClient && locationError && (
                <Alert variant="destructive">
                    <AlertTitle>Lokasi Gagal Dimuat</AlertTitle>
                    <AlertDescription>{locationError}</AlertDescription>
                </Alert>
             )}

            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />

            <div className="space-y-2">
              <Label>Tipe Absen</Label>
              <Select value={attendanceType} onValueChange={(v) => setAttendanceType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check-in">Absen Masuk</SelectItem>
                  <SelectItem value="check-out">Absen Pulang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {location ? `Lokasi: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Mencari lokasi...'}
            </div>
            <Button className="w-full" onClick={handleAttendanceSubmit} disabled={isPending || !hasCameraPermission || !location}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Ambil Foto & Kirim Absen
            </Button>
          </CardContent>
        </Card>

        {/* Forms Card */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan P2H LV</CardTitle>
                    <CardDescription>Lakukan pemeriksaan harian kendaraan sebelum digunakan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Unit LV</Label>
                            <Select value={p2hUnit} onValueChange={setP2hUnit}>
                                <SelectTrigger><SelectValue placeholder="Pilih Unit" /></SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(vehicle => <SelectItem key={vehicle.id} value={vehicle.fleetNumber}>{vehicle.fleetNumber} ({vehicle.category})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>HM (Hour Meter)</Label>
                            <Input type="number" placeholder="Masukkan angka HM" value={p2hHourMeter} onChange={e => setP2hHourMeter(e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Catatan P2H (Opsional)</Label>
                        <Textarea placeholder="Contoh: Ban depan kiri kurang angin." value={p2hNotes} onChange={e => setP2hNotes(e.target.value)} />
                    </div>
                     <Button className="w-full sm:w-auto" onClick={handleP2hSubmit} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Kirim Laporan P2H
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Laporan Kondisi Unit</CardTitle>
                    <CardDescription>Laporkan jika ada kerusakan atau masalah pada unit.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label>Unit LV</Label>
                        <Select value={conditionUnit} onValueChange={setConditionUnit}>
                            <SelectTrigger><SelectValue placeholder="Pilih Unit" /></SelectTrigger>
                            <SelectContent>
                                {vehicles.map(vehicle => <SelectItem key={vehicle.id} value={vehicle.fleetNumber}>{vehicle.fleetNumber} ({vehicle.category})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Catatan Kondisi/Kerusakan</Label>
                        <Textarea placeholder="Jelaskan kondisi atau kerusakan unit secara detail." value={conditionNotes} onChange={e => setConditionNotes(e.target.value)} />
                    </div>
                     <Button className="w-full sm:w-auto" onClick={handleConditionSubmit} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Kirim Laporan Kondisi
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Absensi</CardTitle>
                    <CardDescription>Daftar absensi masuk dan pulang Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Jam</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Lokasi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length > 0 ? (
                                history.map(rec => (
                                    <TableRow key={rec.id}>
                                        <TableCell>{format(new Date(rec.timestamp as any), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>{format(new Date(rec.timestamp as any), 'HH:mm:ss')}</TableCell>
                                        <TableCell>
                                            <Badge variant={rec.type === 'check-in' ? 'default' : 'secondary'}>
                                                {rec.type === 'check-in' ? 'Masuk' : 'Pulang'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Belum ada riwayat absensi.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
