

'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Candidate } from '@/lib/types';
import { Search, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function QuickNikCheck({ allEmployees, allCandidates }: { allEmployees: Employee[], allCandidates: Candidate[] }) {
  const [nik, setNik] = useState('');
  const [isSearching, startSearch] = useTransition();
  const { toast } = useToast();
  const [searchResult, setSearchResult] = useState<{ status: 'found' | 'not_found', nik: string, foundIn?: 'Karyawan' | 'Kandidat', name?: string, entityStatus?: string } | null>(null);

  const handleSearch = () => {
    if (!nik) {
      toast({ variant: 'destructive', title: 'Error', description: 'NIK wajib diisi.' });
      return;
    }
    setSearchResult(null);
    startSearch(() => {
      const foundEmployee = allEmployees.find(e => e.nik === nik);
      if (foundEmployee) {
        const result = { 
            status: 'found' as const, 
            nik, 
            foundIn: 'Karyawan' as const, 
            name: foundEmployee.name,
            entityStatus: foundEmployee.employeeStatus 
        };
        setSearchResult(result);
        toast({
            variant: 'destructive',
            title: `NIK Sudah Terdaftar (Karyawan)`,
            description: `NIK ${nik} sudah terdaftar atas nama ${foundEmployee.name} dengan status "${foundEmployee.employeeStatus}".`
        });
        return;
      }
      
      const foundCandidate = allCandidates.find(c => c.nik === nik);
      if (foundCandidate) {
        const result = { 
            status: 'found' as const, 
            nik, 
            foundIn: 'Kandidat' as const, 
            name: foundCandidate.name,
            entityStatus: foundCandidate.status
        };
        setSearchResult(result);
        toast({
            variant: 'destructive',
            title: `NIK Sudah Terdaftar (Kandidat)`,
            description: `NIK ${nik} sudah terdaftar sebagai kandidat atas nama ${foundCandidate.name} dengan status "${foundCandidate.status}".`
        });
        return;
      }

      setSearchResult({ status: 'not_found', nik });
      toast({
          title: 'NIK Tersedia',
          description: `NIK ${nik} belum terdaftar dan dapat digunakan.`
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cek Ketersediaan NIK</CardTitle>
        <CardDescription>Pastikan NIK belum terdaftar sebelum melakukan registrasi karyawan baru.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder="Masukkan NIK Karyawan..."
            value={nik}
            onChange={(e) => setNik(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Cek
          </Button>
        </div>
        {searchResult && (
            <Alert variant={searchResult.status === 'found' ? 'destructive' : 'default'} className="mt-4">
                <AlertTitle>
                    {searchResult.status === 'found' 
                        ? `NIK Sudah Ada (${searchResult.foundIn})` 
                        : 'NIK Tersedia'}
                </AlertTitle>
                <AlertDescription>
                     {searchResult.status === 'found' 
                        ? (
                            <div className="flex flex-col gap-1">
                                <span>NIK {searchResult.nik} sudah digunakan oleh {searchResult.name}.</span>
                                {searchResult.entityStatus && (
                                    <span>Status saat ini: <Badge variant="outline" className="capitalize">{searchResult.entityStatus}</Badge></span>
                                )}
                            </div>
                        )
                        : `NIK ${searchResult.nik} dapat digunakan untuk registrasi.`
                     }
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
