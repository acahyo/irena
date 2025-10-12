
'use client';

import { useState, useMemo, useTransition } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Candidate, Position, User } from '@/lib/types';
import { createCandidate, updateCandidate, deleteCandidate } from '@/actions/candidates';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getStatusVariant = (status: Candidate['status']) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Interview': return 'default';
    case 'Hired': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function CandidatesClientPage({ 
  initialCandidates, 
  positions, 
  user 
}: { 
  initialCandidates: Candidate[], 
  positions: Position[],
  user: User
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate> | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const handleOpenDialog = (candidate: Partial<Candidate> | null = null) => {
    setEditingCandidate(candidate);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    startTransition(async () => {
        try {
            if (editingCandidate?.id) {
                await updateCandidate(editingCandidate.id, data);
                toast({ title: 'Sukses!', description: 'Data kandidat berhasil diperbarui.' });
            } else {
                await createCandidate({
                    ...data,
                    recruiterId: user.id,
                    recruiterName: user.name,
                });
                toast({ title: 'Sukses!', description: 'Kandidat baru berhasil ditambahkan.' });
            }
            setIsDialogOpen(false);
            router.refresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan data kandidat.' });
        }
    });
  }
  
  const handleDelete = (id: string) => {
      startTransition(async () => {
          try {
              await deleteCandidate(id);
              setCandidates(prev => prev.filter(c => c.id !== id));
              toast({ title: 'Sukses!', description: 'Data kandidat telah dihapus.' });
          } catch(error) {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus data kandidat.' });
          }
      });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Kandidat</CardTitle>
              <CardDescription>Kelola data calon karyawan yang masuk.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Tambah Kandidat</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Posisi Dilamar</TableHead>
                <TableHead>Tanggal Melamar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{candidate.phone}</div>
                    <div className="text-xs text-muted-foreground">{candidate.email}</div>
                  </TableCell>
                  <TableCell>{candidate.positionApplied}</TableCell>
                  <TableCell>{format(new Date(candidate.appliedDate), 'PPP')}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(candidate.status)}>{candidate.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(candidate)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Anda yakin?</AlertDialogTitle><AlertDialogDescription>Aksi ini akan menghapus data kandidat secara permanen.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(candidate.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {candidates.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada data kandidat.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingCandidate?.id ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}</DialogTitle>
                <DialogDescription>Isi detail informasi calon karyawan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input id="name" name="name" defaultValue={editingCandidate?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">No. Handphone</Label>
                        <Input id="phone" name="phone" defaultValue={editingCandidate?.phone} required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email (Opsional)</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingCandidate?.email || ''} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Input id="address" name="address" defaultValue={editingCandidate?.address} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="positionApplied">Posisi yang Dilamar</Label>
                    <Select name="positionApplied" defaultValue={editingCandidate?.positionApplied}>
                        <SelectTrigger><SelectValue placeholder="Pilih Posisi" /></SelectTrigger>
                        <SelectContent>
                            {positions.map(pos => <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {editingCandidate?.id && (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={editingCandidate?.status}>
                             <SelectTrigger><SelectValue placeholder="Ubah Status" /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Interview">Interview</SelectItem>
                                <SelectItem value="Hired">Diterima</SelectItem>
                                <SelectItem value="Rejected">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                    <Input id="notes" name="notes" defaultValue={editingCandidate?.notes || ''} />
                </div>

                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
