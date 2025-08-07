
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

export default function NewDepartmentPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Here you would typically handle form submission,
        // e.g., send data to your backend.
        console.log('Form submitted');
        toast({
        title: 'Success!',
        description: 'New department has been added.',
        });
        router.push('/dashboard/department');
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
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Department
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
