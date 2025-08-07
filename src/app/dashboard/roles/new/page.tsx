
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

export default function NewRolePage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('Form submitted');
        toast({
        title: 'Success!',
        description: 'New role has been added.',
        });
        router.push('/dashboard/roles');
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
          <CardTitle>Add New Role</CardTitle>
          <CardDescription>
            Fill out the form below to add a new role.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input id="name" name="name" placeholder="e.g. Administrator" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="e.g. Full access to all features" />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Role
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
