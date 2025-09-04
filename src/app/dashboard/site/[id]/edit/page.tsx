
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
import { getSite, updateSite } from '@/actions/sites';
import type { Site } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditSitePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [site, setSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            const fetchSite = async () => {
                setPageLoading(true);
                try {
                    const data = await getSite(id);
                    if (data) {
                        setSite(data);
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Site not found.',
                        });
                        router.push('/dashboard/site');
                    }
                } catch (error) {
                     toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch site data.',
                    });
                } finally {
                    setPageLoading(false);
                }
            };
            fetchSite();
        }
    }, [id, router, toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!site) return;

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        try {
            await updateSite(id, { name });
            toast({
                title: 'Success!',
                description: 'Site has been updated.',
            });
            router.push('/dashboard/site');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update site.',
            });
        } finally {
            setLoading(false);
        }
    };

  if (pageLoading || !site) {
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
            <Link href="/dashboard/site">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sites
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Site</CardTitle>
          <CardDescription>
            Update the site name below.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Site Name</Label>
                    <Input id="name" name="name" defaultValue={site.name} required />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Site
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
