
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Upload, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createEmployee } from '@/actions/employees';
import type { Employee, Position, Site, User, Candidate } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getPositions } from '@/actions/positions';
import { getSites } from '@/actions/sites';

type SelectedPosition = {
    id: string;
    name: string;
};

export default function RegisterEmployeeClientPage({ user, candidate }: { user: User, candidate?: Candidate }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [positions, setPositions] = useState<Position[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [selectedPositions, setSelectedPositions] = useState<SelectedPosition[]>([]);
  const [positionToAdd, setPositionToAdd] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  
  const [siteLocation, setSiteLocation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      try {
        const [pos, siteData] = await Promise.all([
          getPositions(),
          getSites(),
        ]);
        setPositions(pos);
        setSites(siteData);
        if (candidate) {
          setEmployeeName(candidate.name);
          setSiteLocation(candidate.siteLocation || '');
          if (candidate.dateOfBirth) {
            setDateOfBirth(new Date(candidate.dateOfBirth));
          }
          const initialPosition = pos.find(p => p.name === candidate.positionApplied);
          if (initialPosition) {
            setSelectedPositions([{ id: initialPosition.id, name: initialPosition.name }]);
          }
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch dropdown data.',
        });
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [candidate, toast]);
  
  const handleSiteChange = (value: string) => {
    setSiteLocation(value);
    setSelectedPositions(prev => prev.filter(pos => {
      const positionDetails = positions.find(p => p.name === pos.name);
      return !positionDetails?.projectName || positionDetails.projectName === value;
    }));
    setPositionToAdd('');
  };

  const filteredPositions = useMemo(() => {
    if (!siteLocation) return [];
    return positions.filter(p => !p.projectName || p.projectName === siteLocation);
  }, [positions, siteLocation]);

  const addPosition = () => {
    const position = positions.find(p => p.id === positionToAdd);
    if (position && !selectedPositions.some(p => p.id === position.id)) {
        setSelectedPositions([...selectedPositions, { id: position.id, name: position.name }]);
        setPositionToAdd('');
    }
  };

  const removePosition = (positionId: string) => {
      setSelectedPositions(selectedPositions.filter(p => p.id !== positionId));
  };


  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          title: 'File terlalu besar',
          description: 'Ukuran file tidak boleh melebihi 1MB.',
        });
        event.target.value = ''; // Clear the input
        return;
      }
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/x-icon'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Tipe File Tidak Valid',
            description: 'Silakan unggah file gambar (jpg, png, ico).',
        });
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setter(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setter(null);
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    delete data.photo;

    const employeeData: Partial<Employee> = {
        ...data,
        dateOfBirth: dateOfBirth,
        avatar: photoPreview,
        positions: selectedPositions.map(p => p.name),
    } as Partial<Employee>;
    
    try {
        await createEmployee(employeeData, user.role);
        toast({
            title: 'Success!',
            description: 'New employee has been registered and is pending verification.',
        });
        router.push('/dashboard/employees');
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to register new employee.',
        });
    } finally {
        setLoading(false);
    }
  };

  const DatePicker = ({
    date,
    setDate,
    showYearDropdown = false
  }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    showYearDropdown?: boolean;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar 
            mode="single" 
            selected={date} 
            onSelect={setDate} 
            initialFocus 
            captionLayout={showYearDropdown ? "dropdown-buttons" : "buttons"}
            fromYear={showYearDropdown ? 1960 : undefined}
            toYear={showYearDropdown ? new Date().getFullYear() : undefined}
        />
      </PopoverContent>
    </Popover>
  );

  const FileInput = ({
    id,
    label,
    preview,
    onChange,
    required = false,
  }: {
    id: string;
    label: string;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
  }) => (
     <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive">*</span>}</Label>
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24 rounded-md">
          <AvatarImage src={preview || undefined} alt={label} className="object-contain" />
          <AvatarFallback className="rounded-md">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Input
          id={id}
          name={id}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/x-icon"
          onChange={onChange}
          className="max-w-sm"
          required={required}
        />
      </div>
    </div>
  );


  if (pageLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-40" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-60" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[500px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dasbor
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Registrasi Karyawan Baru</CardTitle>
          <CardDescription>
            Isi formulir untuk mendaftarkan karyawan baru. Data akan diverifikasi oleh HR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">

            <Card>
                <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                        <FileInput id="photo" label="Photo" preview={photoPreview} onChange={(e) => handleFileChange(e, setPhotoPreview)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nik">NIK</Label>
                        <Input id="nik" name="nik" placeholder="e.g. 3201..." required defaultValue={candidate?.nik || ''} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input id="name" name="name" placeholder="e.g. John Doe" required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                        <Input id="placeOfBirth" name="placeOfBirth" placeholder="e.g. Jakarta" defaultValue={candidate?.placeOfBirth || ''} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                        <DatePicker date={dateOfBirth} setDate={setDateOfBirth} showYearDropdown />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Jenis Kelamin</Label>
                        <Select name="gender" defaultValue={candidate?.gender}>
                            <SelectTrigger id="gender"><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                <SelectItem value="Perempuan">Perempuan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Status Perkawinan</Label>
                        <Select name="maritalStatus" defaultValue={candidate?.maritalStatus}>
                            <SelectTrigger id="maritalStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Lajang</SelectItem>
                                <SelectItem value="married">Menikah</SelectItem>
                                <SelectItem value="divorced">Cerai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="address">Alamat</Label>
                        <Input id="address" name="address" placeholder="e.g. 123 Main St, Anytown" required defaultValue={candidate?.address || ''} />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Contact & Emergency</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="e.g. john@example.com" defaultValue={candidate?.email || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="e.g. 08123456789" defaultValue={candidate?.phone || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Nama Kontak Darurat</Label>
                        <Input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Jane Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactNumber">Nomor Kontak Darurat</Label>
                        <Input id="emergencyContactNumber" name="emergencyContactNumber" placeholder="e.g. 08123456789" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Lokasi & Posisi</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="siteLocation">Lokasi/Site Kerja <span className="text-destructive">*</span></Label>
                        <Select name="siteLocation" value={siteLocation} onValueChange={handleSiteChange} required>
                        <SelectTrigger id="siteLocation-select">
                            <SelectValue placeholder="Pilih Lokasi/Site" />
                        </SelectTrigger>
                        <SelectContent>
                            {sites.map((site) => (
                            <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                            <Label>Jabatan</Label>
                            <div className="flex items-center gap-2">
                                <Select value={positionToAdd} onValueChange={setPositionToAdd} disabled={!siteLocation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={!siteLocation ? "Pilih proyek dulu" : "Pilih jabatan"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredPositions.filter(p => !selectedPositions.some(sp => sp.id === p.id)).map((pos) => (
                                            <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={addPosition} disabled={!positionToAdd}><PlusCircle className="mr-2 h-4 w-4" /> Tambah</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                                {selectedPositions.map((pos) => (
                                    <Badge key={pos.id} variant="secondary" className="flex items-center gap-2">
                                        {pos.name}
                                        <button type="button" onClick={() => removePosition(pos.id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </button>
                                    </Badge>
                                ))}
                                {selectedPositions.length === 0 && <p className="text-sm text-muted-foreground">Belum ada jabatan dipilih.</p>}
                            </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Daftarkan Karyawan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
