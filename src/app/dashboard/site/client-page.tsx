
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { deleteSite, getSites } from '@/actions/sites';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/lib/types';


export default function SiteClientPage({ initialSites }: { initialSites: Site[]}) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const { toast } = useToast();

  useEffect(() => {
    setSites(initialSites);
  }, [initialSites]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSite(id);
      toast({
        title: 'Success!',
        description: 'Site has been deleted.',
      });
      const data = await getSites();
      setSites(data);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete site.',
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Lokasi/Site</CardTitle>
                <CardDescription>
                    Kelola lokasi atau site kerja perusahaan Anda di sini.
                </CardDescription>
            </div>
            <Button asChild>
                <Link href="/dashboard/site/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Site
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Lokasi/Site</TableHead>
                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length > 0 ? (
                sites.map((site) => (
                    <TableRow key={site.id}>
                        <TableCell className="font-medium">{site.name}</TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/site/${site.id}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </Link>
                                    </DropdownMenuItem>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                 <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the site.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(site.id)}>
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        No sites found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
