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
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Calendar, FileText, Heart, Home, Landmark, Mail, MapPin, Pencil, Phone, ShieldCheck, Trash2, User, UserCheck, UserSquare, Users, Briefcase, CalendarCheck, VenetianMask, WalletCards, Star, DollarSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EmployeeWithPosition, LeaveRequest, Position } from '@/lib/types';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Approved':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};


// The employee object passed here should have dates pre-formatted as strings
export default function EmployeeProfileClientPage({ employee, isPortalView = false }: { employee: EmployeeWithPosition & { dateOfBirth?: string, messEntryDate?: string, contractStartDate?: string, contractEndDate?: string }, isPortalView?: boolean }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleRemove = async () => {
        try {
            await deleteEmployee(employee.id);
            toast({
                title: 'Success!',
                description: `Employee ${employee.name} has been removed.`,
            });
            router.push('/dashboard/employees');
            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove employee.',
            });
        }
    };

  const DetailItem = ({ icon, label, value, currency = false }: { icon: React.ReactNode, label: string, value?: string | number | null, currency?: boolean }) => {
    if (!value && value !== 0) return null;
    
    let displayValue = value;
    if (currency && typeof value === 'number') {
        displayValue = formatCurrency(value);
    }
    
    return (
      <div className="flex items-start gap-4">
        <div className="text-muted-foreground w-5 mt-1">{icon}</div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-muted-foreground">{displayValue}</p>
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

  const getEmployeeStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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
       {!isPortalView && (
            <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/employees">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Employees
                </Link>
            </Button>
       )}

      <Card>
        <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{employee.name}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
                {(employee.positions && employee.positions.length > 0) ? (
                    employee.positions.map(pos => <Badge key={pos} variant="secondary">{pos}</Badge>)
                ) : (
                    <p className="text-lg text-muted-foreground">No Position</p>
                )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{employee.department} - {employee.siteLocation}</p>
          </div>
           <div className="flex gap-2">
            {isPortalView ? (
                <Button asChild variant="outline">
                    <Link href="/portal/profile/edit">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
            ) : (
                <>
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
                </>
            )}
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
                <DetailItem icon={<FileText className="h-5 w-5"/>} label="Nomor NPWP" value={employee.npwpNumber} />
                <DetailItem icon={<MapPin className="h-5 w-5"/>} label="Place of Birth" value={employee.placeOfBirth} />
                <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Date of Birth" value={employee.dateOfBirth} />
                <DetailItem icon={<VenetianMask className="h-5 w-5"/>} label="Gender" value={employee.gender} />
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
                <DetailItem icon={<Briefcase className="h-5 w-5"/>} label="Tipe Akun" value={employee.accountType} />
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
                <DetailItem icon={<Users className="h-5 w-5"/>} label="Department" value={employee.department} />
                <DetailItem icon={<MapPin className="h-5 w-5"/>} label="Site Location" value={employee.siteLocation} />
                <DetailItem icon={<Clock className="h-5 w-5"/>} label="Shift" value={employee.shift} />
                <DetailItem icon={<FileText className="h-5 w-5"/>} label="ID Card Number" value={employee.idCardNumber} />
                <DetailItem icon={<FileText className="h-5 w-5"/>} label="Work Contract Number" value={employee.workContractNumber} />
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
                {employee.bpjsStatus === 'active' && (
                    <>
                         {employee.bpjsType && (
                            <div className="flex items-start gap-4">
                                <div className="text-muted-foreground w-5 mt-1"><ShieldCheck className="h-5 w-5"/></div>
                                <div>
                                    <p className="font-semibold text-sm">BPJS Type</p>
                                    <Badge variant='outline' className="capitalize mt-1">
                                        {employee.bpjsType.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                         )}
                        <DetailItem icon={<FileText className="h-5 w-5"/>} label="BPJS Number" value={employee.bpjsNumber} />
                    </>
                 )}
                 <div className="flex items-start gap-4">
                    <div className="text-muted-foreground w-5 mt-1"><UserCheck className="h-5 w-5"/></div>
                    <div>
                        <p className="font-semibold text-sm">Status Karyawan</p>
                        {employee.employeeStatus ? (
                             <Badge variant={getEmployeeStatusVariant(employee.employeeStatus)} className="capitalize mt-1">
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
                <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Mess Entry Date" value={employee.messEntryDate} />
                <DetailItem icon={<Briefcase className="h-5 w-5"/>} label="Peralatan Kerja" value={employee.workEquipment} />
            </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Contract Information</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Contract Start Date" value={employee.contractStartDate} />
                <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Contract End Date" value={employee.contractEndDate} />
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><WalletCards /> Salary Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {(employee.positionDetails && employee.positionDetails.length > 0) ? employee.positionDetails.map((pos: Position, idx: number) => (
                    <div key={idx} className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                         <CardDescription className="font-semibold mb-2">Gaji untuk Jabatan: <Badge variant="outline" className="capitalize">{pos.name}</Badge></CardDescription>
                         {pos.salaryType === 'harian' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               <DetailItem icon={<DollarSign className="h-5 w-5"/>} label="Upah per Hari" value={pos.dailyWage} currency />
                               <DetailItem icon={<Star className="h-5 w-5"/>} label="Lembur per Jam" value={pos.overtimeRate} currency />
                            </div>
                         )}
                         {(pos.salaryType === 'bulanan' || pos.salaryType === 'direksi') && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               <DetailItem icon={<DollarSign className="h-5 w-5"/>} label="Gaji Pokok Bulanan" value={pos.monthlySalary} currency />
                               {pos.allowances?.map((allowance, index) => (
                                   <DetailItem key={index} icon={<Star className="h-5 w-5"/>} label={allowance.name} value={allowance.amount} currency />
                               ))}
                            </div>
                         )}
                    </div>
                 )) : (
                    <p className="text-muted-foreground text-center py-4">Detail gaji belum diatur untuk jabatan karyawan ini.</p>
                 )}
            </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5"/> Leave History</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employee.leaveHistory && employee.leaveHistory.length > 0 ? (
                            employee.leaveHistory.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.startDate as string}</TableCell>
                                    <TableCell>{req.endDate as string}</TableCell>
                                    <TableCell>{req.type}</TableCell>
                                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No leave history found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Documents</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <PhotoItem label="KTP Photo" src={employee.ktpPhoto} hint="ID card" />
                <PhotoItem label="SIM Photo" src={employee.simPhoto} hint="drivers license" />
                <PhotoItem label="SIO Photo" src={employee.sioPhoto} hint="license" />
                <PhotoItem label="Kartu Keluarga Photo" src={employee.kartuKeluargaPhoto} hint="family card" />
                <PhotoItem label="Buku Rekening" src={employee.bankBookPhoto} hint="bank book" />
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
