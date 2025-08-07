
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

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
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
              <div className="space-y-2 md:col-span-3">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={photoPreview || undefined} alt="Employee Photo" />
                        <AvatarFallback>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <Input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="max-w-sm" />
                </div>
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
                <Input
                  id="placeOfBirth"
                  name="placeOfBirth"
                  placeholder="e.g. Jakarta"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateOfBirth && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth ? (
                        format(dateOfBirth, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={setDateOfBirth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <Input
                  id="address"
                  name="address"
                  placeholder="e.g. 123 Main St, Anytown"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nama Kontak Darurat</Label>
                <Input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
               <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergencyContactNumber">Nomor Kontak Darurat</Label>
                <Input
                  id="emergencyContactNumber"
                  name="emergencyContactNumber"
                  placeholder="e.g. 08123456789"
                  required
                />
              </div>

               <div className="space-y-2">
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  placeholder="e.g. Bank Central Asia"
                  required
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  placeholder="e.g. 1234567890"
                  required
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="accountHolderName">Nama Rekening</Label>
                <Input
                  id="accountHolderName"
                  name="accountHolderName"
                  placeholder="e.g. John Doe"
                  required
                />
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
