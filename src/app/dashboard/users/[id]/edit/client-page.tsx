'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
import type { User, Role, Site } from '@/lib/types';
import { updateUser } from '@/actions/users';

export default function EditUserClientPage({ user, roles, sites }: { user: User, roles: Role[], sites: Site[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(user.role);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const role = formData.get('role') as string;
        const password = formData.get('password') as string;
        const siteId = formData.get('siteId') as string;

        const userData: Partial<User> = { name, email, role };
        if (password) {
            userData.password = password;
        }
        if (role === 'Admin Proyek') {
            userData.siteId = siteId;
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

                    {selectedRole === 'Admin Proyek' && (
                       <div className="space-y-2">
                            <Label htmlFor="siteId">Proyek</Label>
                            <Select name="siteId" defaultValue={user.siteId} required>
                                <SelectTrigger id="siteId">
                                    <SelectValue placeholder="Pilih Proyek" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sites.map((site) => (
                                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
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
