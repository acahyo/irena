
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
import type { Employee } from '@/lib/types';
import { Search, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function QuickNikCheck({ allEmployees }: { allEmployees: Employee[] }) {
  const [nik, setNik] = useState('');
  const [isSearching, startSearch] = useTransition();
  const { toast } = useToast();
  const [searchResult, setSearchResult] = useState<{ status: 'found' | 'not_found', nik: string } | null>(null);

  const handleSearch = () => {
    if (!nik) {
      toast({ variant: 'destructive', title: 'Error', description: 'NIK wajib diisi.' });
      return;
    }
    setSearchResult(null);
    startSearch(() => {
      const foundEmployee = allEmployees.find(e => e.nik === nik);
      if (foundEmployee) {
        setSearchResult({ status: 'found', nik });
        toast({
            variant: 'destructive',
            title: 'NIK Sudah Terdaftar',
            description: `NIK ${nik} sudah terdaftar atas nama ${foundEmployee.name}.`
        });
      } else {
        setSearchResult({ status: 'not_found', nik });
        toast({
            title: 'NIK Tersedia',
            description: `NIK ${nik} belum terdaftar dan dapat digunakan.`
        });
      }
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
                <AlertTitle>{searchResult.status === 'found' ? 'NIK Sudah Ada' : 'NIK Tersedia'}</AlertTitle>
                <AlertDescription>
                     {searchResult.status === 'found' 
                        ? `NIK ${searchResult.nik} sudah digunakan.`
                        : `NIK ${searchResult.nik} dapat digunakan untuk registrasi.`
                     }
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
