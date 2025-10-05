

'use client';

import { useState } from 'react';
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
import type { User, Role, Site, Position } from '@/lib/types';
import { updateUser } from '@/actions/users';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


export default function EditUserClientPage({ user, roles, sites, positions }: { user: User, roles: Role[], sites: Site[], positions: Position[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(user.role);
    const [projectAccess, setProjectAccess] = useState<'all' | 'assigned'>(user.projectAccess || 'all');
    const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(user.siteIds || []);
    const [siteToAdd, setSiteToAdd] = useState('');

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
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const role = formData.get('role') as string;
        const password = formData.get('password') as string;
        const positionName = formData.get('positionName') as string;

        const userData: Partial<User> = { 
          name, 
          email, 
          role,
          projectAccess: role !== 'Admin Proyek' ? projectAccess : undefined,
          siteIds: (role === 'Admin Proyek' || projectAccess === 'assigned') ? selectedSiteIds : undefined,
        };

        if (password) {
            userData.password = password;
        }
        if (role === 'Admin Absensi') {
            userData.positionName = positionName;
        }


        try {
            await updateUser(user.id, userData);
            toast({
                title: 'Success!',
                description: 'User has been updated.',
            });
            router.push('/dashboard/users');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update user.',
            });
        } finally {
            setLoading(false);
        }
    };
    
    const showProjectAccessOptions = selectedRole && selectedRole !== 'Admin Proyek';
    const showSiteSelector = selectedRole === 'Admin Proyek' || (showProjectAccessOptions && projectAccess === 'assigned');


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
          <CardTitle>Edit User</CardTitle>
          <CardDescription>
            Update the form below to edit the user's details.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input id="name" name="name" placeholder="e.g. John Doe" required defaultValue={user.name} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="e.g. john@example.com" required defaultValue={user.email} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" name="password" type="password" placeholder="Leave blank to keep current password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" defaultValue={user.role} onValueChange={setSelectedRole} required>
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
                            <RadioGroup name="projectAccess" defaultValue={projectAccess} onValueChange={(value) => setProjectAccess(value as any)} className="flex gap-4">
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
                                {selectedSiteIds.map(id => {
                                    const site = sites.find(s => s.id === id);
                                    return (
                                        <Badge key={id} variant="secondary" className="flex items-center gap-2">
                                            {site?.name}
                                            <button type="button" onClick={() => removeSite(id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                                {selectedSiteIds.length === 0 && <p className="text-sm text-muted-foreground">Belum ada proyek dipilih.</p>}
                            </div>
                            <input type="hidden" name="siteIds" value={selectedSiteIds.join(',')} />
                        </div>
                    )}
                    {selectedRole === 'Admin Absensi' && (
                       <div className="space-y-2">
                            <Label htmlFor="positionName">Jabatan</Label>
                            <Select name="positionName" defaultValue={user.positionName} required>
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
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update User
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

