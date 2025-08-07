
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

export default function NewPositionPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Here you would typically handle form submission,
        // e.g., send data to your backend.
        console.log('Form submitted');
        toast({
        title: 'Success!',
        description: 'New position has been added.',
        });
        router.push('/dashboard/position');
    };

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/position">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Positions
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Position</CardTitle>
          <CardDescription>
            Fill out the form below to add a new position.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Position Name</Label>
                    <Input id="name" name="name" placeholder="e.g. Software Engineer" required />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Position
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
