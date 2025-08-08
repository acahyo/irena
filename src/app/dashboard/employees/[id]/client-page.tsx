

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Calendar, FileText, Heart, Home, Landmark, Mail, MapPin, Pencil, Phone, ShieldCheck, Trash2, User, UserCheck, UserSquare, Users, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { Employee } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { deleteEmployee } from '@/actions/employees';

// Helper to safely format dates that might be strings or Date objects
const formatDate = (date: string | Date | undefined): string | undefined => {
  if (!date) return undefined;
  // Firestore Timestamps are often serialized as ISO strings
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  try {
    return format(dateObj, 'PPP');
  } catch (error) {
    console.error("Invalid date format:", date);
    return 'Invalid Date';
  }
};

export default function EmployeeProfileClientPage({ employee }: { employee: Employee }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleRemove = async () => {
        try {
            await deleteEmployee(employee.id);
            toast({
                title: 'Success!',
                description: `Employee ${employee.name} has been removed.`,
            });
            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove employee.',
            });
        }
    };

  const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-4">
        <div className="text-muted-foreground w-5 mt-1">{icon}</div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-muted-foreground">{value}</p>
        </div>
      </div>
    );
  };
  
  const PhotoItem = ({ label, src, hint }: { label: string, src?: string, hint: string }) => {
    if (!src) return null;
    return (
      <div className="space-y-2">
        <p className="font-semibold text-sm">{label}</p>
        <div className="border rounded-md p-2">
            <img src={src} alt={label} className="w-full h-auto rounded" data-ai-hint={hint} />
        </div>
      </div>
    );
  };

  const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status) {
          case 'active':
              return 'default';
          case 'nonaktif':
              return 'secondary';
          case 'resign':
              return 'outline';
          case 'phk':
              return 'destructive';
          default:
              return 'secondary';
      }
  };

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Employees
            </Link>
        </Button>

      <Card>
        <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{employee.name}</h2>
            <p className="text-lg text-muted-foreground">{employee.role}</p>
            <p className="text-sm text-muted-foreground">{employee.department} - {employee.siteLocation}</p>
          </div>
           <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href={`/dashboard/employees/${employee.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    employee's record from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemove}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={<UserSquare className="h-5 w-5"/>} label="NIK" value={employee.nik} />
                <DetailItem icon={<MapPin className="h-5 w-5"/>} label="Place of Birth" value={employee.placeOfBirth} />
                <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
                <DetailItem icon={<Home className="h-5 w-5"/>} label="Address" value={employee.address} />
                <DetailItem icon={<Heart className="h-5 w-5"/>} label="Marital Status" value={employee.maritalStatus} />
            </CardContent>
        </Card>

        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contact & Emergency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={<Mail className="h-5 w-5"/>} label="Email" value={employee.email} />
                <DetailItem icon={<Phone className="h-5 w-5"/>} label="Phone" value={employee.phone} />
                <DetailItem icon={<Users className="h-5 w-5"/>} label="Emergency Contact" value={employee.emergencyContactName} />
                <DetailItem icon={<Phone className="h-5 w-5"/>} label="Emergency Number" value={employee.emergencyContactNumber} />
            </CardContent>
        </Card>

        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={<Landmark className="h-5 w-5"/>} label="Bank Name" value={employee.bankName} />
                <DetailItem icon={<User className="h-5 w-5"/>} label="Account Holder" value={employee.accountHolderName} />
                <DetailItem icon={<FileText className="h-5 w-5"/>} label="Account Number" value={employee.accountNumber} />
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem icon={<User className="h-5 w-5"/>} label="Position" value={employee.position} />
                <DetailItem icon={<Users className="h-5 w-5"/>} label="Department" value={employee.department} />
                <DetailItem icon={<MapPin className="h-5 w-5"/>} label="Site Location" value={employee.siteLocation} />
                <DetailItem icon={<FileText className="h-5 w-5"/>} label="ID Card Number" value={employee.idCardNumber} />
                <DetailItem icon={<FileText className="h-5 w-5"/>} label="Simper Number" value={employee.simperNumber} />
                 <div className="flex items-start gap-4">
                    <div className="text-muted-foreground w-5 mt-1"><ShieldCheck className="h-5 w-5"/></div>
                    <div>
                        <p className="font-semibold text-sm">BPJS Status</p>
                        {employee.bpjsStatus ? (
                             <Badge variant={employee.bpjsStatus === 'active' ? 'default' : 'destructive'} className="capitalize mt-1">
                                {employee.bpjsStatus}
                            </Badge>
                        ) : <p className="text-muted-foreground">N/A</p>}
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="text-muted-foreground w-5 mt-1"><UserCheck className="h-5 w-5"/></div>
                    <div>
                        <p className="font-semibold text-sm">Status Karyawan</p>
                        {employee.employeeStatus ? (
                             <Badge variant={getStatusVariant(employee.employeeStatus)} className="capitalize mt-1">
                                {employee.employeeStatus}
                            </Badge>
                        ) : <p className="text-muted-foreground">N/A</p>}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Accommodation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={<Home className="h-5 w-5"/>} label="Mess Room" value={employee.messRoomNumber} />
                <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Mess Entry Date" value={formatDate(employee.messEntryDate)} />
                <DetailItem icon={<Briefcase className="h-5 w-5"/>} label="Peralatan Kerja" value={employee.workEquipment} />
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Contract Information</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Contract Start Date" value={formatDate(employee.contractStartDate)} />
                <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Contract End Date" value={formatDate(employee.contractEndDate)} />
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Documents</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PhotoItem label="SIM Photo" src={employee.simPhoto} hint="drivers license" />
                <PhotoItem label="SIO Photo" src={employee.sioPhoto} hint="license" />
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
