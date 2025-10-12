

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
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Loader2, UserPlus, ExternalLink, Upload, Calendar as CalendarIcon, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Candidate, Position, User, Site } from '@/lib/types';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate } from '@/actions/candidates';
import { getPositions } from '@/actions/positions';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getSites } from '@/actions/sites';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminSession } from '@/actions/auth';
import { ScrollArea } from '@/components/ui/scroll-area';

const getStatusVariant = (status: Candidate['status']) => {
  switch (status) {
    case 'Menunggu': return 'secondary';
    case 'Interview': return 'default';
    case 'Tes Unit/Alat': return 'default';
    case 'Diterima': return 'default';
    case 'Ditolak': return 'destructive';
    default: return 'outline';
  }
};

export default function CandidatesClientPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate> | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedSite, setSelectedSite] = useState('');
  
  const [currentStatus, setCurrentStatus] = useState<Candidate['status'] | undefined>();
  const [interviewDoc, setInterviewDoc] = useState<string | null>(null);
  const [testDoc, setTestDoc] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();

  useEffect(() => {
    const fetchInitialData = async () => {
        setPageLoading(true);
        try {
            const [sessionUser, candidatesData, positionsData, sitesData] = await Promise.all([
                getAdminSession(),
                getCandidates(),
                getPositions(),
                getSites()
            ]);
            
            if (!sessionUser) {
              router.push('/dashboard');
              return;
            }
            setUser(sessionUser);

            setCandidates(candidatesData);
            setPositions(positionsData);
            setSites(sitesData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Gagal memuat data kandidat."});
        } finally {
            setPageLoading(false);
        }
    };
    fetchInitialData();
  }, [router, toast]);
  
  const handleOpenDialog = (candidate: Partial<Candidate> | null = null) => {
    setEditingCandidate(candidate);
    setSelectedSite(candidate?.siteLocation || '');
    setCurrentStatus(candidate?.status || 'Menunggu');
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
    if (!user) return;
    
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
            const updatedCandidates = await getCandidates();
            setCandidates(updatedCandidates);
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
  
  if (pageLoading || !user) {
      return (
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-60" />
                      <Skeleton className="h-4 w-80" />
                  </CardHeader>
                  <CardContent>
                      <Skeleton className="h-64 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }

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
                <TableHead>Riwayat Status</TableHead>
                <TableHead>Status Saat Ini</TableHead>
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
                   <TableCell>
                    <div className="flex flex-col gap-1">
                      {candidate.statusHistory && candidate.statusHistory.length > 0 ? (
                        candidate.statusHistory
                          .slice()
                          .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
                          .map((historyItem, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <Badge variant={getStatusVariant(historyItem.status)} className="w-24 justify-center">{historyItem.status}</Badge>
                              <span className="text-muted-foreground">{format(new Date(historyItem.date), 'dd/MM/yy')}</span>
                            </div>
                          ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No history</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getStatusVariant(candidate.status)}>{candidate.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {candidate.status === 'Diterima' || candidate.status === 'Ditolak' ? (
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(candidate)}>
                          <Eye className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{editingCandidate?.id ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}</DialogTitle>
                <DialogDescription>Isi detail informasi calon karyawan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <ScrollArea className="max-h-[70vh] p-1">
              <div className="space-y-6 p-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nik">NIK</Label>
                        <Input id="nik" name="nik" defaultValue={editingCandidate?.nik} required disabled={!!editingCandidate?.id} />
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
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" value={currentStatus} onValueChange={(value) => setCurrentStatus(value as Candidate['status'])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Menunggu">Menunggu</SelectItem>
                                    <SelectItem value="Interview">Interview</SelectItem>
                                    <SelectItem value="Tes Unit/Alat">Tes Unit/Alat</SelectItem>
                                    <SelectItem value="Diterima">Diterima</SelectItem>
                                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {editingCandidate.statusHistory && editingCandidate.statusHistory.length > 0 && (
                            <div className="space-y-2">
                                <Label>Riwayat Status</Label>
                                <div className="space-y-2 rounded-md border p-3">
                                    {editingCandidate.statusHistory.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                                            </div>
                                            <span className="text-muted-foreground">{format(new Date(item.date), 'dd MMM yyyy')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {currentStatus === 'Interview' && (
                    <div className="space-y-2 border p-3 rounded-md">
                        <Label htmlFor="interviewDoc" className="flex items-center gap-2">
                           <Upload className="h-4 w-4" /> Dokumen Hasil Interview
                        </Label>
                        <Input id="interviewDoc" type="file" onChange={(e) => handleFileChange(e, setInterviewDoc)} />
                        {editingCandidate?.interviewDocUrl && !interviewDoc?.startsWith('data:') && (
                             <a href={editingCandidate.interviewDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Lihat file yang sudah diunggah
                            </a>
                        )}
                    </div>
                )}
                 {currentStatus === 'Tes Unit/Alat' && (
                    <div className="space-y-2 border p-3 rounded-md">
                        <Label htmlFor="testDoc" className="flex items-center gap-2">
                           <Upload className="h-4 w-4" /> Dokumen Hasil Tes
                        </Label>
                        <Input id="testDoc" type="file" onChange={(e) => handleFileChange(e, setTestDoc)} />
                         {editingCandidate?.testDocUrl && !testDoc?.startsWith('data:') && (
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
                 {editingCandidate?.status === 'Diterima' && (
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/employees/register?candidateId=${editingCandidate.id}`}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Proses Kandidat Menjadi Karyawan
                      </Link>
                    </Button>
                )}
              </div>
              </ScrollArea>

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
