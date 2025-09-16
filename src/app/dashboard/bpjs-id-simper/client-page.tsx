'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ShieldCheck, Contact, WalletCards, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Employee, Site, Position } from '@/lib/types';


export default function BpjsIdSimperClientPage({
    employees,
    sites,
    positions
}: {
    employees: Employee[],
    sites: Site[],
    positions: Position[],
}) {
  const [projectFilter, setProjectFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesProject = projectFilter === 'all' || emp.siteLocation === projectFilter;
      const matchesPosition = positionFilter === 'all' || emp.position === positionFilter;
      return matchesProject && matchesPosition;
    });
  }, [employees, projectFilter, positionFilter]);


  const totalEmployees = filteredEmployees.length;
  // BPJS Stats
  const bpjsActive = filteredEmployees.filter(e => e.bpjsStatus === 'active');
  const bpjsActiveMiki = bpjsActive.filter(e => e.bpjsType === 'miki').length;
  const bpjsActiveIba = bpjsActive.filter(e => e.bpjsType === 'iba').length;
  const bpjsInactive = filteredEmployees.filter(e => e.bpjsStatus === 'inactive').length;
  const bpjsNotRegistered = totalEmployees - bpjsActive.length - bpjsInactive;

  // ID Card Stats
  const idCardActive = filteredEmployees.filter(e => e.idCardNumber).length;
  const idCardNotRegistered = totalEmployees - idCardActive;

  // SIMPER Stats
  const simperActive = filteredEmployees.filter(e => e.simperNumber).length;
  const simperNotRegistered = totalEmployees - simperActive;

  const StatCard = ({ title, icon, total, details }: { title: string, icon: React.ReactNode, total: number, details?: { label: string, value: number, variant?: "default" | "secondary" | "destructive" | "outline" }[] }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        {details && (
          <div className="mt-2 space-y-2">
            {details.map(detail => (
              <div key={detail.label} className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">{detail.label}</p>
                <Badge variant={detail.variant || 'secondary'}>{detail.value}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Karyawan"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
        />
        <StatCard
          title="Status BPJS"
          icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
          details={[
            { label: 'Aktif (MIKI)', value: bpjsActiveMiki, variant: 'default' },
            { label: 'Aktif (IBA)', value: bpjsActiveIba, variant: 'default' },
            { label: 'Tidak Aktif', value: bpjsInactive, variant: 'destructive' },
            { label: 'Belum Terdaftar', value: bpjsNotRegistered },
          ]}
        />
        <StatCard
          title="Status ID Card"
          icon={<Contact className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
          details={[
            { label: 'Aktif / Terdaftar', value: idCardActive, variant: 'default' },
            { label: 'Belum Terdaftar', value: idCardNotRegistered },
          ]}
        />
        <StatCard
          title="Status SIMPER"
          icon={<WalletCards className="h-4 w-4 text-muted-foreground" />}
          total={totalEmployees}
          details={[
            { label: 'Aktif / Terdaftar', value: simperActive, variant: 'default' },
            { label: 'Belum Terdaftar', value: simperNotRegistered },
          ]}
        />
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Data Karyawan</CardTitle>
                        <CardDescription>
                        Detail status BPJS, ID Card, dan SIMPER untuk setiap karyawan.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Proyek</SelectItem>
                                {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={positionFilter} onValueChange={setPositionFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by Position" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jabatan</SelectItem>
                                {positions.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Karyawan</TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead>BPJS</TableHead>
                            <TableHead>ID Card</TableHead>
                            <TableHead>SIMPER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell>
                                     <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={emp.avatar} alt={emp.name} />
                                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{emp.name}</p>
                                            <p className="text-sm text-muted-foreground">{emp.position || 'N/A'}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{emp.siteLocation || 'N/A'}</TableCell>
                                <TableCell>
                                    {!emp.bpjsStatus && <Badge variant="secondary">Belum Terdaftar</Badge>}
                                    {emp.bpjsStatus === 'active' && (
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="default">Aktif</Badge>
                                            <span className="text-xs text-muted-foreground">{emp.bpjsNumber || 'No. tidak ada'}</span>
                                        </div>
                                    )}
                                    {emp.bpjsStatus === 'inactive' && <Badge variant="destructive">Tidak Aktif</Badge>}
                                </TableCell>
                                <TableCell>
                                    {emp.idCardNumber ? (
                                         <div className="flex flex-col gap-1">
                                            <Badge variant="default">Aktif</Badge>
                                            <span className="text-xs text-muted-foreground">{emp.idCardNumber}</span>
                                        </div>
                                    ) : (
                                        <Badge variant="secondary">Belum Terdaftar</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {emp.simperNumber ? (
                                         <div className="flex flex-col gap-1">
                                            <Badge variant="default">Aktif</Badge>
                                            <span className="text-xs text-muted-foreground">{emp.simperNumber}</span>
                                        </div>
                                    ) : (
                                        <Badge variant="secondary">Belum Terdaftar</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredEmployees.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Tidak ada data karyawan ditemukan untuk filter yang dipilih.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    </div>
  );
}
