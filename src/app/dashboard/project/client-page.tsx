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
import { MoreHorizontal, PlusCircle, Trash2, Pencil, User, Phone } from 'lucide-react';
import { deleteSite, getSites } from '@/actions/sites';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/lib/types';


export default function ProjectClientPage({ initialSites }: { initialSites: Site[]}) {
  const [sites, setSites] = useState<Site[]>(initialSites || []);
  const { toast } = useToast();

  useEffect(() => {
    setSites(initialSites || []);
  }, [initialSites]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSite(id);
      toast({
        title: 'Success!',
        description: 'Proyek telah dihapus.',
      });
      const data = await getSites();
      setSites(data);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus proyek.',
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Proyek</CardTitle>
                <CardDescription>
                    Kelola lokasi atau site proyek perusahaan Anda di sini.
                </CardDescription>
            </div>
            <Button asChild>
                <Link href="/dashboard/project/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Proyek
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Proyek/Site</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Pengawas</TableHead>
                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {sites && sites.length > 0 ? (
                sites.map((site) => (
                    <TableRow key={site.id}>
                        <TableCell className="font-medium">{site.name}</TableCell>
                        <TableCell>
                          {site.picName ? (
                            <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-2"><User className="h-4 w-4" /> {site.picName}</span>
                                <span className="text-muted-foreground text-xs flex items-center gap-2"><Phone className="h-3 w-3" /> {site.picContact}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                         <TableCell>
                            {site.supervisors && site.supervisors.length > 0 ? (
                                <ul className="list-disc list-inside">
                                    {site.supervisors.map(s => <li key={s.id} className="text-sm">{s.name}</li>)}
                                </ul>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
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
                                      <Link href={`/dashboard/project/${site.id}/edit`}>
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
                                                This action cannot be undone. This will permanently delete the project.
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
                    <TableCell colSpan={4} className="h-24 text-center">
                        Tidak ada proyek ditemukan.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
