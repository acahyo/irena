
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Upload } from 'lucide-react';
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

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [messEntryDate, setMessEntryDate] = useState<Date | undefined>();
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>();
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [simPreview, setSimPreview] = useState<string | null>(null);
  const [sioPreview, setSioPreview] = useState<string | null>(null);

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


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Here you would typically handle form submission,
    // e.g., send data to your backend.
    console.log('Form submitted');
    toast({
      title: 'Success!',
      description: 'New employee has been added.',
    });
    router.push('/dashboard');
  };

  const DatePicker = ({
    date,
    setDate,
  }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
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
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  );

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
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Employee</CardTitle>
          <CardDescription>
            Fill out the form below to add a new employee to the directory.
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
                <Input id="nik" name="nik" placeholder="e.g. 3201..." required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g. John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                <Input id="placeOfBirth" name="placeOfBirth" placeholder="e.g. Jakarta" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                <DatePicker date={dateOfBirth} setDate={setDateOfBirth} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Status Perkawinan</Label>
                <Select name="maritalStatus">
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
                <Input id="address" name="address" placeholder="e.g. 123 Main St, Anytown" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nama Kontak Darurat</Label>
                <Input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Jane Doe" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergencyContactNumber">Nomor Kontak Darurat</Label>
                <Input id="emergencyContactNumber" name="emergencyContactNumber" placeholder="e.g. 08123456789" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input id="bankName" name="bankName" placeholder="e.g. Bank Central Asia" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input id="accountNumber" name="accountNumber" placeholder="e.g. 1234567890" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Nama Rekening</Label>
                <Input id="accountHolderName" name="accountHolderName" placeholder="e.g. John Doe" required />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Status BPJS</Label>
                <RadioGroup name="bpjsStatus" className="flex gap-4">
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

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <FileInput id="simPhoto" label="Foto SIM" preview={simPreview} onChange={(e) => handleFileChange(e, setSimPreview)} />
                <FileInput id="sioPhoto" label="Foto SIO" preview={sioPreview} onChange={(e) => handleFileChange(e, setSioPreview)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="simperNumber">Nomor Simper</Label>
                <Input id="simperNumber" name="simperNumber" placeholder="e.g. 12345" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idCardNumber">Nomor ID Card</Label>
                <Input id="idCardNumber" name="idCardNumber" placeholder="e.g. 67890" />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="position">Jabatan</Label>
                 <Input id="position" name="position" placeholder="e.g. Operator" />
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
                <Input id="department" name="department" placeholder="e.g. Produksi" />
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
                <Input id="siteLocation" name="siteLocation" placeholder="e.g. Site A" />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">
                Save Employee
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
