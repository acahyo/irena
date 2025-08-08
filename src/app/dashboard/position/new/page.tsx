
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
import { createPosition } from '@/actions/positions';

export default function NewPositionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        try {
            await createPosition({ name });
            toast({
                title: 'Success!',
                description: 'New position has been added.',
            });
            router.push('/dashboard/position');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add new position.',
            });
        } finally {
            setLoading(false);
        }
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
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Position
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
