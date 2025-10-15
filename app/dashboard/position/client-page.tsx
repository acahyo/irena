

'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Briefcase } from 'lucide-react';
import { getPositions, deletePosition } from '@/actions/positions';
import { useToast } from '@/hooks/use-toast';
import type { Position } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};


export default function PositionClientPage({ initialPositions }: { initialPositions: Position[]}) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const { toast } = useToast();

  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  const groupedPositions = useMemo(() => {
    return positions.reduce((acc, pos) => {
      const key = pos.projectName || 'Jabatan Umum';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(pos);
      return acc;
    }, {} as Record<string, Position[]>);
  }, [positions]);

  const sortedProjects = useMemo(() => {
    return Object.keys(groupedPositions).sort((a, b) => {
      if (a === 'Jabatan Umum') return -1;
      if (b === 'Jabatan Umum') return 1;
      return a.localeCompare(b);
    });
  }, [groupedPositions]);


  const handleDelete = async (id: string) => {
    try {
      await deletePosition(id);
      toast({
        title: 'Success!',
        description: 'Position has been deleted.',
      });
      const data = await getPositions();
      setPositions(data);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete position.',
      });
    }
  };


  return (
    <div className="space-y-6">
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Jabatan &amp; Gaji</CardTitle>
                    <CardDescription>
                        Kelola jabatan perusahaan dan detail gaji terkait, dikelompokkan berdasarkan proyek.
                    </CardDescription>
                </div>
                <Button asChild>
                    <Link href="/dashboard/position/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Jabatan
                    </Link>
                </Button>
            </div>
          </CardHeader>
      </Card>
      
      <div className="space-y-8">
        {sortedProjects.map(project => (
            <Card key={project}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        {project}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Jabatan</TableHead>
                                <TableHead>Tipe Gaji</TableHead>
                                <TableHead>Gaji Pokok / Upah Harian</TableHead>
                                <TableHead>Lembur per Jam</TableHead>
                                <TableHead className="w-[100px] text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {groupedPositions[project].length > 0 ? (
                            groupedPositions[project].map((pos) => (
                                <TableRow key={pos.id}>
                                    <TableCell className="font-medium">{pos.name}</TableCell>
                                    <TableCell>
                                        {pos.salaryType ? (
                                            <Badge variant="outline" className="capitalize">{pos.salaryType}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">Not Set</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {pos.salaryType === 'harian' 
                                            ? formatCurrency(pos.dailyWage)
                                            : formatCurrency(pos.monthlySalary)
                                        }
                                    </TableCell>
                                    <TableCell>{formatCurrency(pos.overtimeRate)}</TableCell>
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
                                                <Link href={`/dashboard/position/${pos.id}/edit`}>
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
                                                            This action cannot be undone. This will permanently delete the position.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(pos.id)}>
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
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Tidak ada jabatan ditemukan untuk proyek ini.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
