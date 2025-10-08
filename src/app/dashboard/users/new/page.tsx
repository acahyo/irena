
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoles } from '@/actions/roles';
import { createUser } from '@/actions/users';
import { getEmployees } from '@/actions/employees';
import { getUsers } from '@/actions/users';
import { getSites } from '@/actions/sites';
import { getPositions } from '@/actions/positions';
import type { Role, Employee, User, Site, Position } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


export default function NewUserPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [projectAccess, setProjectAccess] = useState<'all' | 'assigned'>('all');
    const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
    const [siteToAdd, setSiteToAdd] = useState('');
    const [shiftAccess, setShiftAccess] = useState<'all' | 'assigned'>('all');

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const [fetchedRoles, fetchedEmployees, existingUsers, fetchedSites, fetchedPositions] = await Promise.all([
                    getRoles(),
                    getEmployees(),
                    getUsers(),
                    getSites(),
                    getPositions(),
                ]);

                const existingUserEmails = new Set(existingUsers.map(u => u.email));
                const availableEmployees = fetchedEmployees.filter(emp => emp.email && !existingUserEmails.has(emp.email));

                setRoles(fetchedRoles);
                setEmployees(availableEmployees);
                setSites(fetchedSites);
                setPositions(fetchedPositions);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to fetch initial data.',
                });
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);

    const addSite = () => {
      if (siteToAdd && !selectedSiteIds.includes(siteToAdd)) {
          setSelectedSiteIds([...selectedSiteIds, siteToAdd]);
          setSiteToAdd('');
      }
    };

    const removeSite = (siteIdToRemove: string) => {
        setSelectedSiteIds(selectedSiteIds.filter(id => id !== siteIdToRemove));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEmployeeId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select an employee.',
            });
            return;
        }

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const role = formData.get('role') as string;
        const password = formData.get('password') as string;
        const positionName = formData.get('positionName') as string;
        const shiftName = formData.get('shiftName') as User['shiftName'];

        const userData: Omit<User, 'id'> = { 
            name: selectedEmployee?.name || '', 
            email: selectedEmployee?.email || '', 
            role, 
            password,
            projectAccess: role !== 'Admin Proyek' ? projectAccess : undefined,
            siteIds: (role === 'Admin Proyek' || projectAccess === 'assigned') ? selectedSiteIds : undefined,
            shiftAccess: role === 'Admin Proyek' ? shiftAccess : undefined,
            shiftName: role === 'Admin Proyek' && shiftAccess === 'assigned' ? shiftName : undefined,
        };

        if (role === 'Admin Absensi') {
            userData.positionName = positionName;
        }

        try {
            await createUser(userData);
            toast({
                title: 'Success!',
                description: 'New user has been added.',
            });
            router.push('/dashboard/users');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add new user.',
            });
        } finally {
            setLoading(false);
        }
    };

    const showProjectAccessOptions = selectedRole && selectedRole !== 'Admin Proyek';
    const showSiteSelector = selectedRole === 'Admin Proyek' || (showProjectAccessOptions && projectAccess === 'assigned');


  if (pageLoading) {
      return <p>Loading data...</p>;
  }

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>
            Select an employee to create a user account for them.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="employee">Employee</Label>
                        <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                            <SelectTrigger id="employee">
                                <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.email})</SelectItem>
                                ))}
                                {employees.length === 0 && <div className="p-2 text-sm text-muted-foreground">No available employees found.</div>}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" value={selectedEmployee?.email || ''} readOnly disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" onValueChange={setSelectedRole} required>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showProjectAccessOptions && (
                        <div className="space-y-3 md:col-span-2">
                            <Label>Akses Data Proyek</Label>
                            <RadioGroup name="projectAccess" value={projectAccess} onValueChange={(value) => setProjectAccess(value as any)} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="access-all" />
                                    <Label htmlFor="access-all">Lihat Semua Proyek</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="assigned" id="access-assigned" />
                                    <Label htmlFor="access-assigned">Berdasarkan Proyek yang Dikelola</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                    
                    {selectedRole === 'Admin Proyek' && (
                        <>
                         <div className="space-y-3 md:col-span-2">
                            <Label>Akses Data Shift</Label>
                            <RadioGroup name="shiftAccess" defaultValue={shiftAccess} onValueChange={(value) => setShiftAccess(value as any)} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="shift-access-all" />
                                    <Label htmlFor="shift-access-all">Lihat Semua Shift</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="assigned" id="shift-access-assigned" />
                                    <Label htmlFor="shift-access-assigned">Berdasarkan Shift Tertentu</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {shiftAccess === 'assigned' && (
                            <div className="space-y-2">
                                <Label htmlFor="shiftName">Pilih Shift</Label>
                                <Select name="shiftName" required>
                                    <SelectTrigger id="shiftName">
                                        <SelectValue placeholder="Select a shift" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Regular">Regular</SelectItem>
                                        <SelectItem value="Shift A">Shift A</SelectItem>
                                        <SelectItem value="Shift B">Shift B</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        </>
                    )}


                    {showSiteSelector && (
                       <div className="space-y-4 md:col-span-2">
                            <Label>Proyek yang Dikelola</Label>
                            <div className="flex items-center gap-2">
                                <Select value={siteToAdd} onValueChange={setSiteToAdd}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih proyek untuk ditambahkan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sites.filter(s => !selectedSiteIds.includes(s.id)).map((site) => (
                                            <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={addSite} disabled={!siteToAdd}><PlusCircle className="mr-2 h-4 w-4" /> Tambah</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                                {selectedSiteIds.length > 0 ? selectedSiteIds.map(id => {
                                    const site = sites.find(s => s.id === id);
                                    return (
                                        <Badge key={id} variant="secondary" className="flex items-center gap-2">
                                            {site?.name}
                                            <button type="button" onClick={() => removeSite(id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </button>
                                        </Badge>
                                    );
                                }) : (
                                    <div className="text-sm text-muted-foreground p-1">Belum ada proyek dipilih.</div>
                                )}
                            </div>
                            <input type="hidden" name="siteIds" value={selectedSiteIds.join(',')} />
                        </div>
                    )}
                     {selectedRole === 'Admin Absensi' && (
                       <div className="space-y-2">
                            <Label htmlFor="positionName">Jabatan</Label>
                            <Select name="positionName" required>
                                <SelectTrigger id="positionName">
                                    <SelectValue placeholder="Pilih Jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {positions.map((pos) => (
                                        <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !selectedEmployeeId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save User
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

    