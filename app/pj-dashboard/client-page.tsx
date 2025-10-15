
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, Send, Loader2, LogOut } from 'lucide-react';
import type { Employee, PjAttendance } from '@/lib/types';
import { submitPjAttendance } from '@/actions/pj';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { logout } from '@/actions/auth';

export default function PjDashboardClient({ employee, initialHistory }: { employee: Employee, initialHistory: PjAttendance[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [attendanceType, setAttendanceType] = useState<'Masuk' | 'Pulang' | 'Izin' | 'Sakit'>('Masuk');
  const [keterangan, setKeterangan] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const [isClient, setIsClient] = useState(false);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);

  const needsPhoto = attendanceType === 'Masuk' || attendanceType === 'Pulang';
  const needsKeterangan = attendanceType === 'Izin' || attendanceType === 'Sakit';

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
        setHasCameraPermission(false);
        console.error('Error accessing camera:', error);
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
            setLocationError('');
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

    if (needsPhoto) {
        getCameraPermission();
    }
    getLocation();
  }, [needsPhoto]);

  const takePicture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    setPhotoDataUri(dataUri);
  }

  const handleSubmit = () => {
    if (!location) {
        toast({ variant: 'destructive', title: 'Error', description: 'Lokasi tidak ditemukan.' });
        return;
    }
    if (needsPhoto && !photoDataUri) {
        toast({ variant: 'destructive', title: 'Error', description: 'Foto selfie wajib diambil untuk absen masuk/pulang.' });
        return;
    }
    if (needsKeterangan && !keterangan) {
        toast({ variant: 'destructive', title: 'Error', description: 'Keterangan wajib diisi untuk izin/sakit.' });
        return;
    }

    startTransition(async () => {
      const result = await submitPjAttendance({
        pjId: employee.id,
        pjName: employee.name,
        type: attendanceType,
        latitude: location.latitude,
        longitude: location.longitude,
        photoDataUri: photoDataUri || undefined,
        keterangan: keterangan || undefined,
      });

      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        const newRecord: PjAttendance = {
            id: new Date().toISOString(),
            pjId: employee.id,
            pjName: employee.name,
            timestamp: new Date().toISOString() as any,
            type: attendanceType,
            latitude: location.latitude,
            longitude: location.longitude,
            photoUrl: photoDataUri || undefined,
            keterangan: keterangan || undefined,
        };
        setHistory(prev => [newRecord, ...prev]);
        // Reset form
        setPhotoDataUri(null);
        setKeterangan('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleLogout = async () => {
    startTransition(async () => {
        await logout('employee');
        router.push('/login/pj');
    });
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
        case 'Masuk': return 'default';
        case 'Pulang': return 'secondary';
        case 'Izin': return 'outline';
        case 'Sakit': return 'destructive';
        default: return 'default';
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Selamat datang, {employee.name}.</CardTitle>
                    <CardDescription>Silakan rekam absensi Anda di sini.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Keluar
                </Button>
            </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Attendance Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Formulir Absensi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isClient && locationError && (
                <Alert variant="destructive">
                    <AlertTitle>Lokasi Gagal Dimuat</AlertTitle>
                    <AlertDescription>{locationError}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="attendance-type">Keterangan Kehadiran</Label>
              <Select value={attendanceType} onValueChange={(v) => setAttendanceType(v as any)}>
                <SelectTrigger id="attendance-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masuk">Masuk</SelectItem>
                  <SelectItem value="Pulang">Pulang</SelectItem>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {needsPhoto && isClient && (
                 <div className="space-y-2">
                    <Label>Foto Selfie</Label>
                    {!hasCameraPermission && (
                        <Alert variant="destructive">
                            <AlertTitle>Kamera Tidak Dapat Diakses</AlertTitle>
                            <AlertDescription>Mohon izinkan akses kamera di browser Anda.</AlertDescription>
                        </Alert>
                    )}
                    <video ref={videoRef} className={cn("w-full aspect-video rounded-md bg-muted", photoDataUri && 'hidden')} autoPlay muted playsInline />
                    {photoDataUri && (
                        <div className="relative w-full aspect-video">
                            <Image src={photoDataUri} alt="Selfie Preview" layout="fill" className="object-cover rounded-md" />
                        </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={takePicture} disabled={!hasCameraPermission || isPending}>
                        <Camera className="mr-2 h-4 w-4" />
                        {photoDataUri ? 'Ambil Ulang Foto' : 'Ambil Foto'}
                    </Button>
                 </div>
            )}
            
             {needsKeterangan && (
                 <div className="space-y-2">
                    <Label htmlFor="keterangan">Keterangan</Label>
                    <Textarea id="keterangan" placeholder="Contoh: Izin urusan keluarga." value={keterangan} onChange={e => setKeterangan(e.target.value)} />
                </div>
            )}

            <div className="text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {location ? `Lokasi: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Mencari lokasi...'}
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={isPending || !location}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Kirim Absensi
            </Button>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Riwayat Absensi Saya</CardTitle>
                <CardDescription>Daftar absensi yang telah Anda rekam.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Jam</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Keterangan/Foto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length > 0 ? (
                            history.map(rec => (
                                <TableRow key={rec.id}>
                                    <TableCell>{isClient ? format(new Date(rec.timestamp as any), 'dd MMM yyyy') : 'Loading...'}</TableCell>
                                    <TableCell>{isClient ? format(new Date(rec.timestamp as any), 'HH:mm:ss'): '...'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getTypeVariant(rec.type)}>
                                            {rec.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {rec.photoUrl ? (
                                            <a href={rec.photoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lihat Foto</a>
                                        ) : (
                                            rec.keterangan || '-'
                                        )}
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
  );
}

    