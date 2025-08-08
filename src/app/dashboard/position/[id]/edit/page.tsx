
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
import { getPosition, updatePosition } from '@/actions/positions';
import type { Position } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPositionPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [position, setPosition] = useState<Position | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            const fetchPosition = async () => {
                setPageLoading(true);
                try {
                    const data = await getPosition(id);
                    if (data) {
                        setPosition(data);
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Position not found.',
                        });
                        router.push('/dashboard/position');
                    }
                } catch (error) {
                     toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch position data.',
                    });
                } finally {
                    setPageLoading(false);
                }
            };
            fetchPosition();
        }
    }, [id, router, toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!position) return;

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        try {
            await updatePosition(id, { name });
            toast({
                title: 'Success!',
                description: 'Position has been updated.',
            });
            router.push('/dashboard/position');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update position.',
            });
        } finally {
            setLoading(false);
        }
    };

  if (pageLoading || !position) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-40" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

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
          <CardTitle>Edit Position</CardTitle>
          <CardDescription>
            Update the position name below.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Position Name</Label>
                    <Input id="name" name="name" defaultValue={position.name} required />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Position
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
