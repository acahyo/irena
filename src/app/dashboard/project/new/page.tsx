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
import { createSite } from '@/actions/sites';

export default function NewProjectPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        try {
            await createSite({ name });
            toast({
                title: 'Success!',
                description: 'Proyek baru telah ditambahkan.',
            });
            router.push('/dashboard/project');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Gagal menambahkan proyek baru.',
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/project">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Proyek
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Proyek Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk menambahkan proyek baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Proyek/Site</Label>
                    <Input id="name" name="name" placeholder="e.g. Proyek Tambang Kaltim" required />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Proyek
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
