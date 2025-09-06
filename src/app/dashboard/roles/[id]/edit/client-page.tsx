'use client';

import { useState, useEffect } from 'react';
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
import { getRole, updateRole } from '@/actions/roles';
import type { Role } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

export default function EditRolePageClient({ role: initialRole }: { role: Role }) {
    const router = useRouter();
    const { toast } = useToast();
    const [role, setRole] = useState<Role>(initialRole);
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        try {
            await updateRole(role.id, { name, description });
            toast({
                title: 'Success!',
                description: 'Role has been updated.',
            });
            router.push('/dashboard/roles');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update role.',
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/roles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Roles
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Role</CardTitle>
          <CardDescription>
            Update the role details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input id="name" name="name" defaultValue={role.name} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={role.description} />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Role
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
