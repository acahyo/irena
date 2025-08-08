
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
import { createDepartment } from '@/actions/departments';

export default function NewDepartmentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        try {
            await createDepartment({ name });
            toast({
                title: 'Success!',
                description: 'New department has been added.',
            });
            router.push('/dashboard/department');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add new department.',
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/department">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Departments
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Department</CardTitle>
          <CardDescription>
            Fill out the form below to add a new department.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input id="name" name="name" placeholder="e.g. Human Resources" required />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Department
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
