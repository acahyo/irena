

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Upload, Loader2, WalletCards } from 'lucide-react';
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
import type { Employee, Department, Position, Site } from '@/lib/types';
import { updateEmployee } from '@/actions/employees';
import { Textarea } from '@/components/ui/textarea';

const parseDate = (date: string | Date | undefined): Date | undefined => {
  if (!date) return undefined;
  if (typeof date === 'string') return new Date(date);
  return date;
};


export default function EditEmployeePageClient({ employee, departments, positions, sites }: { employee: Employee, departments: Department[], positions: Position[], sites: Site[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [messEntryDate, setMessEntryDate] = useState<Date | undefined>();
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>();
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>();

  // Initialize date states on the client to avoid hydration mismatch
  useEffect(() => {
    setDateOfBirth(parseDate(employee.dateOfBirth));
    setMessEntryDate(parseDate(employee.messEntryDate));
    setContractStartDate(parseDate(employee.contractStartDate));
    setContractEndDate(parseDate(employee.contractEndDate));
  }, [employee]);

  const [photoPreview, setPhotoPreview] = useState<string | null>(employee.avatar || null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(employee.ktpPhoto || null);
  const [simPreview, setSimPreview] = useState<string | null>(employee.simPhoto || null);
  const [sioPreview, setSioPreview] = useState<string | null>(employee.sioPhoto || null);
  const [bpjsStatus, setBpjsStatus] = useState<string | undefined>(employee.bpjsStatus);


  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
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

    // Remove file inputs from data object as we handle them separately
    delete data.photo;
    delete data.ktpPhoto;
    delete data.simPhoto;
    delete data.sioPhoto;

    const employeeData: Partial<Employee> = {
        ...data,
        dateOfBirth: dateOfBirth,
        messEntryDate: messEntryDate,
        contractStartDate: contractStartDate,
        contractEndDate: contractEndDate,
        avatar: photoPreview,
        ktpPhoto: ktpPreview,
        simPhoto: simPreview,
        sioPhoto: sioPreview,
    } as Partial<Employee>;
    
    try {
        await updateEmployee(employee.id, employeeData);
        toast({
            title: 'Success!',
            description: 'Employee data has been updated.',
        });
        router.push(`/dashboard/employees/${employee.id}`);
        router.refresh(); // Refresh to show updated data
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update employee.',
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
  }) => {
     const [initialDate, setInitialDate] = useState<Date | undefined>();
      useEffect(() => {
        setInitialDate(date);
      }, [date]);

    return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !initialDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {initialDate ? format(initialDate, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar 
            mode="single" 
            selected={initialDate} 
            onSelect={setDate} 
            initialFocus 
            captionLayout={showYearDropdown ? "dropdown-buttons" : "buttons"}
            fromYear={showYearDropdown ? 1960 : undefined}
            toYear={showYearDropdown ? new Date().getFullYear() : undefined}
        />
      </PopoverContent>
    </Popover>
  )
};

  const FileInput = ({
    id,
    label,
    preview,
    onChange,
  }: {
    id: string;
    label: string;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
     <div className="space-y-2">
      <Label>{label}</Label>
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
          accept="image/*"
          onChange={onChange}
          className="max-w-sm"
        />
      </div>
    </div>
  );


  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/employees/${employee.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employee Details
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Employee</CardTitle>
          <CardDescription>
            Update the form below to edit the employee's details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
              <div className="md:col-span-3">
                 <FileInput id="photo" label="Photo" preview={photoPreview} onChange={(e) => handleFileChange(e, setPhotoPreview)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input id="nik" name="nik" placeholder="e.g. 3201..." required defaultValue={employee.nik} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" name="name" placeholder="e.g. John Doe" required defaultValue={employee.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                <Input id="placeOfBirth" name="placeOfBirth" placeholder="e.g. Jakarta" required defaultValue={employee.placeOfBirth} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                <DatePicker date={dateOfBirth} setDate={setDateOfBirth} showYearDropdown />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Select name="gender" defaultValue={employee.gender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Status Perkawinan</Label>
                <Select name="maritalStatus" defaultValue={employee.maritalStatus}>
                  <SelectTrigger id="maritalStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="address">Alamat</Label>
                <Input id="address" name="address" placeholder="e.g. 123 Main St, Anytown" required defaultValue={employee.address} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="e.g. john@example.com" defaultValue={employee.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="e.g. 08123456789" defaultValue={employee.phone} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nama Kontak Darurat</Label>
                <Input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Jane Doe" defaultValue={employee.emergencyContactName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber">Nomor Kontak Darurat</Label>
                <Input id="emergencyContactNumber" name="emergencyContactNumber" placeholder="e.g. 08123456789" defaultValue={employee.emergencyContactNumber} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input id="bankName" name="bankName" placeholder="e.g. Bank Central Asia" defaultValue={employee.bankName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input id="accountNumber" name="accountNumber" placeholder="e.g. 1234567890" defaultValue={employee.accountNumber} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Nama Rekening</Label>
                <Input id="accountHolderName" name="accountHolderName" placeholder="e.g. John Doe" defaultValue={employee.accountHolderName} />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Status BPJS</Label>
                 <RadioGroup name="bpjsStatus" className="flex gap-4" defaultValue={employee.bpjsStatus} onValueChange={setBpjsStatus}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="bpjs-active" />
                    <Label htmlFor="bpjs-active">Aktif</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="bpjs-inactive" />
                    <Label htmlFor="bpjs-inactive">Non-Aktif</Label>
                  </div>
                </RadioGroup>
              </div>

              {bpjsStatus === 'active' && (
                 <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="bpjsType">Tipe BPJS</Label>
                    <Select name="bpjsType" defaultValue={employee.bpjsType}>
                        <SelectTrigger id="bpjsType">
                            <SelectValue placeholder="Pilih Tipe BPJS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="miki">BPJS MIKI (Potongan 280.000)</SelectItem>
                            <SelectItem value="iba">BPJS IBA (Potongan 322.000)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              )}

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                <FileInput id="ktpPhoto" label="Foto KTP" preview={ktpPreview} onChange={(e) => handleFileChange(e, setKtpPreview)} />
                <FileInput id="simPhoto" label="Foto SIM" preview={simPreview} onChange={(e) => handleFileChange(e, setSimPreview)} />
                <FileInput id="sioPhoto" label="Foto SIO" preview={sioPreview} onChange={(e) => handleFileChange(e, setSioPreview)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardNumber">Nomor ID Card</Label>
                <Input id="idCardNumber" name="idCardNumber" placeholder="e.g. 67890" defaultValue={employee.idCardNumber} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workContractNumber">Nomor Kontrak Kerja</Label>
                <Input id="workContractNumber" name="workContractNumber" placeholder="e.g. KK/2024/001" defaultValue={employee.workContractNumber} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simperNumber">Nomor Simper</Label>
                <Input id="simperNumber" name="simperNumber" placeholder="e.g. 12345" defaultValue={employee.simperNumber} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="position">Jabatan</Label>
                 <Select name="position" defaultValue={employee.position}>
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messRoomNumber">Nomor Kamar/Mes</Label>
                <Input id="messRoomNumber" name="messRoomNumber" placeholder="e.g. A-101" defaultValue={employee.messRoomNumber} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="messEntryDate">Tanggal Masuk Mes</Label>
                <DatePicker date={messEntryDate} setDate={setMessEntryDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                 <Select name="department" defaultValue={employee.department}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
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
                <Label htmlFor="contractEndDate">Tanggal Akhir Kontrak</Label>
                <DatePicker date={contractEndDate} setDate={setContractEndDate} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="siteLocation">Lokasi/Site</Label>
                <Select name="siteLocation" defaultValue={employee.siteLocation}>
                  <SelectTrigger id="siteLocation">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                     {sites.map((site) => (
                        <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="workEquipment">Peralatan Kerja</Label>
                <Textarea id="workEquipment" name="workEquipment" placeholder="e.g. Laptop, Mouse, Keyboard" defaultValue={employee.workEquipment} />
              </div>
              
               <div className="space-y-2">
                <Label htmlFor="employeeStatus">Status Karyawan</Label>
                <Select name="employeeStatus" defaultValue={employee.employeeStatus}>
                  <SelectTrigger id="employeeStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                    <SelectItem value="resign">Resign</SelectItem>
                    <SelectItem value="phk">PHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                 {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Employee
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
