
'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Loader2, UserPlus, ExternalLink, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Candidate, Position, User, Site } from '@/lib/types';
import { createCandidate, updateCandidate, deleteCandidate } from '@/actions/candidates';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getSites } from '@/actions/sites';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const getStatusVariant = (status: Candidate['status']) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Interview': return 'default';
    case 'Tes unit/alat': return 'default';
    case 'Registrasi Karyawan': return 'default';
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

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  
  const [currentStatus, setCurrentStatus] = useState<Candidate['status'] | undefined>();
  const [interviewDoc, setInterviewDoc] = useState<string | null>(null);
  const [testDoc, setTestDoc] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();


  useEffect(() => {
    const fetchSitesData = async () => {
        const sitesData = await getSites();
        setSites(sitesData);
    };
    fetchSitesData();
  }, []);
  
  const handleOpenDialog = (candidate: Partial<Candidate> | null = null) => {
    setEditingCandidate(candidate);
    setSelectedSite(candidate?.siteLocation || '');
    setCurrentStatus(candidate?.status || 'Pending');
    setInterviewDoc(candidate?.interviewDocUrl || null);
    setTestDoc(candidate?.testDocUrl || null);
    setDateOfBirth(candidate?.dateOfBirth ? new Date(candidate.dateOfBirth) : undefined);
    setIsDialogOpen(true);
  };

  const filteredPositions = useMemo(() => {
    if (!selectedSite) return positions.filter(p => !p.projectName);
    const site = sites.find(s => s.name === selectedSite);
    if (!site) return positions.filter(p => !p.projectName);
    return positions.filter(p => !p.projectName || p.projectName === site.name);
  }, [positions, selectedSite, sites]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setter(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    data.dateOfBirth = dateOfBirth;

    // Add document data if they exist
    if (interviewDoc && interviewDoc.startsWith('data:')) data.interviewDocUrl = interviewDoc;
    if (testDoc && testDoc.startsWith('data:')) data.testDocUrl = testDoc;

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
                  <TableCell>
                    {candidate.positionApplied}
                    {candidate.siteLocation && <Badge variant="outline" className="ml-2">{candidate.siteLocation}</Badge>}
                  </TableCell>
                  <TableCell>{format(new Date(candidate.appliedDate), 'PPP')}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(candidate.status)}>{candidate.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {candidate.status === 'Registrasi Karyawan' ? (
                       <Button asChild size="sm">
                          <Link href={`/dashboard/employees/register?candidateId=${candidate.id}`}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Registrasi
                          </Link>
                       </Button>
                    ) : (
                      <>
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
                      </>
                    )}
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
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>{editingCandidate?.id ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}</DialogTitle>
                <DialogDescription>Isi detail informasi calon karyawan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nik">NIK</Label>
                        <Input id="nik" name="nik" defaultValue={editingCandidate?.nik} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input id="name" name="name" defaultValue={editingCandidate?.name} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                        <Input id="placeOfBirth" name="placeOfBirth" defaultValue={editingCandidate?.placeOfBirth} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !dateOfBirth && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{dateOfBirth ? format(dateOfBirth, 'PPP') : <span>Pilih tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} captionLayout="dropdown-buttons" fromYear={1960} toYear={new Date().getFullYear()} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Jenis Kelamin</Label>
                        <Select name="gender" defaultValue={editingCandidate?.gender}>
                            <SelectTrigger><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                <SelectItem value="Perempuan">Perempuan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Status Perkawinan</Label>
                        <Select name="maritalStatus" defaultValue={editingCandidate?.maritalStatus}>
                            <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Lajang</SelectItem>
                                <SelectItem value="married">Menikah</SelectItem>
                                <SelectItem value="divorced">Cerai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Alamat</Label>
                        <Input id="address" name="address" defaultValue={editingCandidate?.address} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">No. Handphone</Label>
                        <Input id="phone" name="phone" defaultValue={editingCandidate?.phone} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Opsional)</Label>
                        <Input id="email" name="email" type="email" defaultValue={editingCandidate?.email || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="siteLocation">Lokasi Proyek</Label>
                        <Select name="siteLocation" value={selectedSite} onValueChange={setSelectedSite}>
                            <SelectTrigger><SelectValue placeholder="Pilih Lokasi" /></SelectTrigger>
                            <SelectContent>
                                {sites.map(site => <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="positionApplied">Posisi yang Dilamar</Label>
                        <Select name="positionApplied" defaultValue={editingCandidate?.positionApplied} disabled={!selectedSite}>
                            <SelectTrigger><SelectValue placeholder={!selectedSite ? "Pilih lokasi dulu" : "Pilih Posisi"} /></SelectTrigger>
                            <SelectContent>
                                {filteredPositions.map(pos => <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {editingCandidate?.id && (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" value={currentStatus} onValueChange={(value) => setCurrentStatus(value as Candidate['status'])}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Interview">Interview</SelectItem>
                                <SelectItem value="Tes unit/alat">Tes unit/alat</SelectItem>
                                <SelectItem value="Registrasi Karyawan">Registrasi Karyawan</SelectItem>
                                <SelectItem value="Hired">Diterima</SelectItem>
                                <SelectItem value="Rejected">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {currentStatus === 'Interview' && (
                    <div className="space-y-2 border p-3 rounded-md">
                        <Label htmlFor="interviewDoc" className="flex items-center gap-2">
                           <Upload className="h-4 w-4" /> Dokumen Hasil Interview
                        </Label>
                        <Input id="interviewDoc" type="file" onChange={(e) => handleFileChange(e, setInterviewDoc)} />
                        {editingCandidate?.interviewDocUrl && (
                             <a href={editingCandidate.interviewDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Lihat file yang sudah diunggah
                            </a>
                        )}
                    </div>
                )}
                 {currentStatus === 'Tes unit/alat' && (
                    <div className="space-y-2 border p-3 rounded-md">
                        <Label htmlFor="testDoc" className="flex items-center gap-2">
                           <Upload className="h-4 w-4" /> Dokumen Hasil Tes
                        </Label>
                        <Input id="testDoc" type="file" onChange={(e) => handleFileChange(e, setTestDoc)} />
                         {editingCandidate?.testDocUrl && (
                             <a href={editingCandidate.testDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Lihat file yang sudah diunggah
                            </a>
                        )}
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
