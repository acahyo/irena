'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, addMonths, differenceInMonths } from 'date-fns';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Employee, Department, Position, Site, User, Candidate } from '@/lib/types';
import { createEmployee } from '@/actions/employees';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type SelectedPosition = {
    id: string;
    name: string;
};

export default function NewEmployeePageClient({
  user,
  departments,
  positions,
  sites,
  candidate,
}: {
  user: User;
  departments: Department[];
  positions: Position[];
  sites: Site[];
  candidate: Candidate | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [messEntryDate, setMessEntryDate] = useState<Date | undefined>();
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>();
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>();
  const [contractDurationMonths, setContractDurationMonths] = useState<number | undefined>();
  const [employeeName, setEmployeeName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [siteLocation, setSiteLocation] = useState('');
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [simPreview, setSimPreview] = useState<string | null>(null);
  const [sioPreview, setSioPreview] = useState<string | null>(null);
  const [kkPreview, setKkPreview] = useState<string | null>(null);
  const [bankBookPreview, setBankBookPreview] = useState<string | null>(null);
  const [bpjsStatus, setBpjsStatus] = useState<string | undefined>('not-registered');
  const [canGeneratePayslip, setCanGeneratePayslip] = useState(true);
  const [selectedPositions, setSelectedPositions] = useState<SelectedPosition[]>([]);
  const [positionToAdd, setPositionToAdd] = useState('');
  const [accountType, setAccountType] = useState<'pribadi' | 'keluarga' | undefined>();

  useEffect(() => {
    if (candidate) {
      setEmployeeName(candidate.name);
      setSiteLocation(candidate.siteLocation || '');
      if (candidate.dateOfBirth) {
        setDateOfBirth(new Date(candidate.dateOfBirth));
      }
      const initialPosition = positions.find(p => p.name === candidate.positionApplied);
      if (initialPosition) {
        setSelectedPositions([{ id: initialPosition.id, name: initialPosition.name }]);
      }
    }
  }, [candidate, positions]);
  
  const filteredPositions = useMemo(() => {
    if (!siteLocation) return positions.filter(p => !p.projectName); // Only general if no site
    return positions.filter(p => !p.projectName || p.projectName === siteLocation);
  }, [positions, siteLocation]);
  
  const handleSiteChange = (value: string) => {
    setSiteLocation(value);
    // Reset selected positions if they are not valid for the new site
    const validPositions = filteredPositions.map(p => p.name);
    setSelectedPositions(prev => prev.filter(pos => validPositions.includes(pos.name)));
    setPositionToAdd('');
  };

  useEffect(() => {
    if (contractStartDate && contractDurationMonths !== undefined && contractDurationMonths > 0) {
      const newEndDate = addMonths(contractStartDate, contractDurationMonths);
      setContractEndDate(newEndDate);
    } else {
      setContractEndDate(undefined);
    }
  }, [contractStartDate, contractDurationMonths]);

  useEffect(() => {
    if (accountType === 'pribadi') {
        setAccountHolderName(employeeName);
    }
  }, [accountType, employeeName]);

  const addPosition = () => {
    const position = filteredPositions.find(p => p.name === positionToAdd);
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
      const reader = new FileReader();
      reader.onload = (e) => setter(e.target?.result as string);
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
    delete data.ktpPhoto;
    delete data.simPhoto;
    delete data.sioPhoto;
    delete data.kartuKeluargaPhoto;
    delete data.bankBookPhoto;
    delete data.positionToAdd;

    const employeeData: Partial<Employee> = {
        ...data,
        dateOfBirth: dateOfBirth,
        messEntryDate: messEntryDate,
        contractStartDate: contractStartDate,
        contractEndDate: contractEndDate,
        contractDurationMonths: contractDurationMonths,
        avatar: photoPreview,
        ktpPhoto: ktpPreview,
        simPhoto: simPreview,
        sioPhoto: sioPreview,
        kartuKeluargaPhoto: kkPreview,
        bankBookPhoto: bankBookPreview,
        canGeneratePayslip: (data.canGeneratePayslip === 'on'),
        positions: selectedPositions.map(p => p.name),
        siteLocation: siteLocation,
    } as Partial<Employee>;
    
    try {
        await createEmployee(employeeData, user?.role);
        toast({
            title: 'Sukses!',
            description: 'Karyawan baru berhasil diregistrasi.',
        });
        const redirectUrl = '/dashboard/employees';
        router.push(redirectUrl);
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Gagal meregistrasi karyawan baru.',
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
          {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
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
          accept="image/png, image/jpeg, image/jpg, image/x-icon, application/pdf"
          onChange={onChange}
          className="max-w-sm"
          required={required && !preview}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/employees">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Karyawan
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Karyawan Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah ini untuk mendaftarkan karyawan baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
              <div className="md:col-span-3">
                 <FileInput id="photo" label="Foto Profil" preview={photoPreview} onChange={(e) => handleFileChange(e, setPhotoPreview)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input id="nik" name="nik" placeholder="e.g. 3201..." required defaultValue={candidate?.nik} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" name="name" placeholder="e.g. John Doe" required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npwpNumber">Nomor NPWP (Opsional)</Label>
                <Input id="npwpNumber" name="npwpNumber" placeholder="e.g. 99.999.999.9-999.999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                <Input id="placeOfBirth" name="placeOfBirth" placeholder="e.g. Jakarta" required defaultValue={candidate?.placeOfBirth} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                <DatePicker date={dateOfBirth} setDate={setDateOfBirth} showYearDropdown />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Select name="gender" defaultValue={candidate?.gender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Pilih Jenis Kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Status Perkawinan</Label>
                <Select name="maritalStatus" defaultValue={candidate?.maritalStatus}>
                  <SelectTrigger id="maritalStatus">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Lajang</SelectItem>
                    <SelectItem value="married">Menikah</SelectItem>
                    <SelectItem value="divorced">Cerai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="address">Alamat</Label>
                <Textarea id="address" name="address" placeholder="e.g. 123 Main St, Anytown" required defaultValue={candidate?.address}/>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="e.g. john@example.com" defaultValue={candidate?.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP</Label>
                <Input id="phone" name="phone" type="tel" placeholder="e.g. 08123456789" defaultValue={candidate?.phone} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nama Kontak Darurat</Label>
                <Input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber">Nomor Kontak Darurat</Label>
                <Input id="emergencyContactNumber" name="emergencyContactNumber" placeholder="e.g. 08123456789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password Akun</Label>
                <Input id="password" name="password" type="password" placeholder="Kosongkan untuk password default" />
              </div>

              <div className="md:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Bank</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Jenis Rekening</Label>
                            <RadioGroup name="accountType" className="flex gap-4" defaultValue={accountType} onValueChange={(value) => setAccountType(value as any)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pribadi" id="acc-pribadi" />
                                    <Label htmlFor="acc-pribadi">Pribadi</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="keluarga" id="acc-keluarga" />
                                    <Label htmlFor="acc-keluarga">Keluarga</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Nama Bank</Label>
                                <Input id="bankName" name="bankName" placeholder="e.g. Bank Central Asia" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                                <Input id="accountNumber" name="accountNumber" placeholder="e.g. 1234567890" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="accountHolderName">Nama Pemilik Rekening</Label>
                                <Input 
                                    id="accountHolderName" 
                                    name="accountHolderName" 
                                    placeholder="e.g. John Doe"
                                    value={accountType === 'pribadi' ? employeeName : accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                    readOnly={accountType === 'pribadi'}
                                />
                            </div>
                        </div>
                        {accountType === 'keluarga' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <FileInput id="kartuKeluargaPhoto" label="Foto Kartu Keluarga" preview={kkPreview} onChange={(e) => handleFileChange(e, setKkPreview)} required={true} />
                                <FileInput id="bankBookPhoto" label="Foto Halaman Depan Buku Rekening" preview={bankBookPreview} onChange={(e) => handleFileChange(e, setBankBookPreview)} required={true} />
                            </div>
                        )}
                    </CardContent>
                </Card>
              </div>


              <div className="space-y-2 md:col-span-3">
                <Label>Status BPJS</Label>
                 <RadioGroup name="bpjsStatus" className="flex gap-4" defaultValue={bpjsStatus} onValueChange={setBpjsStatus}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="bpjs-active" />
                    <Label htmlFor="bpjs-active">Aktif</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-progress" id="bpjs-in-progress" />
                    <Label htmlFor="bpjs-in-progress">Proses Pendaftaran</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-registered" id="bpjs-not-registered" />
                    <Label htmlFor="bpjs-not-registered">Belum Terdaftar</Label>
                  </div>
                </RadioGroup>
              </div>

              {bpjsStatus === 'active' && (
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="bpjsNumber">Nomor BPJS</Label>
                        <Input id="bpjsNumber" name="bpjsNumber" placeholder="e.g. 0001234567890" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bpjsType">Tipe BPJS</Label>
                        <Select name="bpjsType">
                            <SelectTrigger id="bpjsType">
                                <SelectValue placeholder="Pilih Tipe BPJS" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="miki">BPJS MIKI (Potongan 280.000)</SelectItem>
                                <SelectItem value="iba">BPJS IBA (Potongan 322.000)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
              )}

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                <FileInput id="ktpPhoto" label="Foto KTP" preview={ktpPreview} onChange={(e) => handleFileChange(e, setKtpPreview)} />
                <FileInput id="simPhoto" label="Foto SIM" preview={simPreview} onChange={(e) => handleFileChange(e, setSimPreview)} />
                <FileInput id="sioPhoto" label="Foto SIO" preview={sioPreview} onChange={(e) => handleFileChange(e, setSioPreview)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardNumber">Nomor ID Card</Label>
                <Input id="idCardNumber" name="idCardNumber" placeholder="e.g. 67890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workContractNumber">Nomor Kontrak Kerja</Label>
                <Input id="workContractNumber" name="workContractNumber" placeholder="e.g. KK/2024/001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simperNumber">Nomor Simper</Label>
                <Input id="simperNumber" name="simperNumber" placeholder="e.g. 12345" />
              </div>
              
                <div className="space-y-2">
                <Label htmlFor="siteLocation">Lokasi/Site</Label>
                <Select name="siteLocation" value={siteLocation} onValueChange={handleSiteChange} required>
                  <SelectTrigger id="siteLocation-select">
                    <SelectValue placeholder="Pilih Lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                     {sites.map((site) => (
                        <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 md:col-span-2">
                    <Label>Jabatan</Label>
                    <div className="flex items-center gap-2">
                         <Select value={positionToAdd} onValueChange={setPositionToAdd} disabled={!siteLocation}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih jabatan untuk ditambahkan" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredPositions.filter(p => !selectedPositions.some(sp => sp.name === p.name)).map((pos) => (
                                    <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" onClick={addPosition} disabled={!positionToAdd}><PlusCircle className="mr-2 h-4 w-4" /> Tambah</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                        {selectedPositions.length > 0 ? (
                            selectedPositions.map((pos) => (
                            <Badge key={pos.id} variant="secondary" className="flex items-center gap-2">
                                {pos.name}
                                <button type="button" onClick={() => removePosition(pos.id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </button>
                            </Badge>
                        ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Belum ada jabatan dipilih.</p>
                        )}
                    </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="shift">Shift</Label>
                <Select name="shift">
                  <SelectTrigger id="shift">
                    <SelectValue placeholder="Pilih Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Shift A">Shift A</SelectItem>
                    <SelectItem value="Shift B">Shift B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messRoomNumber">Nomor Kamar/Mes</Label>
                <Input id="messRoomNumber" name="messRoomNumber" placeholder="e.g. A-101" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="messEntryDate">Tanggal Masuk Mes</Label>
                <DatePicker date={messEntryDate} setDate={setMessEntryDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                 <Select name="department">
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Pilih Departemen" />
                  </SelectTrigger>
                  <SelectContent>
                     {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label htmlFor="contractStartDate">Tanggal Awal Kontrak</Label>
                <DatePicker date={contractStartDate} setDate={setContractStartDate} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractDurationMonths">Masa Kontrak (bulan)</Label>
                <Input 
                  id="contractDurationMonths" 
                  name="contractDurationMonths" 
                  type="number" 
                  placeholder="e.g. 12"
                  value={contractDurationMonths || ''}
                  onChange={(e) => setContractDurationMonths(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Akhir Kontrak</Label>
                <Input value={contractEndDate ? format(contractEndDate, 'PPP') : 'Akan terisi otomatis'} readOnly disabled />
              </div>
              
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="workEquipment">Peralatan Kerja</Label>
                <Textarea id="workEquipment" name="workEquipment" placeholder="e.g. Laptop, Mouse, Keyboard" />
              </div>
              
               <div className="space-y-2">
                <Label htmlFor="employeeStatus">Status Karyawan</Label>
                <Select name="employeeStatus">
                  <SelectTrigger id="employeeStatus">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                    <SelectItem value="resign">Resign</SelectItem>
                    <SelectItem value="phk">PHK</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-3">
                <div className="space-y-0.5">
                    <Label htmlFor="canGeneratePayslip">Izinkan Cetak Slip Gaji</Label>
                    <CardDescription>
                        Jika dinonaktifkan, slip gaji untuk karyawan ini tidak dapat dibuat.
                    </CardDescription>
                </div>
                <Switch
                    id="canGeneratePayslip"
                    name="canGeneratePayslip"
                    checked={canGeneratePayslip}
                    onCheckedChange={setCanGeneratePayslip}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                 {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Tambah Karyawan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
