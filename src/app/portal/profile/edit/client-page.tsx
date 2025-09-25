'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';
import { updateEmployee } from '@/actions/employees';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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


export default function EditMyProfileClientPage({ employee }: { employee: Employee }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState(employee.accountType);
  const [accountHolderName, setAccountHolderName] = useState(employee.accountHolderName);
  const [kkPreview, setKkPreview] = useState<string | null>(employee.kartuKeluargaPhoto || null);
  const [bankBookPreview, setBankBookPreview] = useState<string | null>(employee.bankBookPhoto || null);
  
  useEffect(() => {
    if (accountType === 'pribadi') {
        setAccountHolderName(employee.name);
    }
  }, [accountType, employee.name]);
  
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

    delete data.kartuKeluargaPhoto;
    delete data.bankBookPhoto;

    const employeeData: Partial<Employee> = {
        ...data,
        accountHolderName,
        kartuKeluargaPhoto: kkPreview,
        bankBookPhoto: bankBookPreview,
    } as Partial<Employee>;

    // Handle empty password
    if (!employeeData.password) {
        delete employeeData.password;
    }
    
    try {
        await updateEmployee(employee.id, employeeData);
        toast({
            title: 'Success!',
            description: 'Your profile has been updated.',
        });
        router.push(`/portal`);
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update your profile.',
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Profile
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit My Profile</CardTitle>
          <CardDescription>
            Update your personal and contact information below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                
                <Card>
                    <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" placeholder="e.g. 123 Main St, Anytown" defaultValue={employee.address} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="e.g. 08123456789" defaultValue={employee.phone} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="maritalStatus">Marital Status</Label>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                            <Input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Jane Doe" defaultValue={employee.emergencyContactName} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emergencyContactNumber">Emergency Contact Number</Label>
                            <Input id="emergencyContactNumber" name="emergencyContactNumber" placeholder="e.g. 08123456789" defaultValue={employee.emergencyContactNumber} />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
                     <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Jenis Rekening</Label>
                             <RadioGroup name="accountType" className="flex gap-4" value={accountType} onValueChange={(value) => setAccountType(value as any)}>
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
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input id="bankName" name="bankName" placeholder="e.g. Bank Central Asia" defaultValue={employee.bankName} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input id="accountNumber" name="accountNumber" placeholder="e.g. 1234567890" defaultValue={employee.accountNumber} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                                <Input 
                                    id="accountHolderName" 
                                    name="accountHolderName" 
                                    value={accountHolderName}
                                    onValueChange={(e: any) => setAccountHolderName(e.target.value)}
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

                 <Card>
                    <CardHeader><CardTitle>Security</CardTitle></CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" name="password" type="password" placeholder="Leave blank to keep current password" />
                            <p className="text-sm text-muted-foreground">If you set a new password, you will be logged out and need to log in again.</p>
                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                 {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
