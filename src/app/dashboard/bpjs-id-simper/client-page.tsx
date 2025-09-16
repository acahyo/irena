'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Loader2, Users, ShieldCheck, UserSquare, WalletCards } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateEmployee } from '@/actions/employees';
import type { Employee, Site, Position } from '@/lib/types';


export default function BpjsIdSimperClientPage({
    employees: initialEmployees,
    sites,
    positions
}: {
    employees: Employee[],
    sites: Site[],
    positions: Position[],
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [projectFilter, setProjectFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const stats = useMemo(() => {
    const totalEmployees = initialEmployees.length;
    
    const employeesByProject = initialEmployees.reduce((acc, emp) => {
        const project = emp.siteLocation || 'Tanpa Proyek';
        acc[project] = (acc[project] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const bpjsStats = initialEmployees.reduce((acc, emp) => {
        const status = emp.bpjsStatus || 'not-registered';
        acc[status] = (acc[status] || 0) + 1;
        if (status === 'active') {
            const type = emp.bpjsType || 'unknown';
            acc.types[type] = (acc.types[type] || 0) + 1;
        }
        return acc;
    }, { 'active': 0, 'inactive': 0, 'not-registered': 0, types: {} as Record<string, number> });

    const idCardStats = initialEmployees.reduce((acc, emp) => {
        const status = emp.idCardStatus || 'not-registered';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { 'active': 0, 'in-progress': 0, 'not-registered': 0 });
    
    const simperStats = initialEmployees.reduce((acc, emp) => {
        const status = emp.simperStatus || 'not-registered';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { 'active': 0, 'in-progress': 0, 'not-registered': 0 });

    return { totalEmployees, employeesByProject, bpjsStats, idCardStats, simperStats };
  }, [initialEmployees]);
  
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesProject = projectFilter === 'all' || emp.siteLocation === projectFilter;
      const matchesPosition = positionFilter === 'all' || emp.position === positionFilter;
      return matchesProject && matchesPosition;
    });
  }, [employees, projectFilter, positionFilter]);

  const handleFieldChange = (employeeId: string, field: keyof Employee, value: any) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId ? { ...emp, [field]: value } : emp
      )
    );
  };
  
  const handleSave = (employeeId: string, field: keyof Employee, value: any) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    // Optimistically update UI
    handleFieldChange(employeeId, field, value);

    startSavingTransition(async () => {
        try {
            await updateEmployee(employeeId, { [field]: value });
            toast({
                title: 'Tersimpan!',
                description: `Data ${String(field)} untuk ${employee.name} telah diperbarui.`,
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: `Gagal menyimpan data untuk ${employee.name}.`,
            });
            // Revert on error if needed, though for simplicity we don't here.
        }
    });
  };

  const handleBpjsStatusChange = (employeeId: string, value: string) => {
    const updateData: Partial<Employee> = { bpjsStatus: value as any };
    if (value !== 'active') {
        updateData.bpjsNumber = '';
        updateData.bpjsType = undefined;
    }
    
    setEmployees(prev => 
      prev.map(emp => emp.id === employeeId ? { ...emp, ...updateData } : emp)
    );

    startSavingTransition(async () => {
        try {
            await updateEmployee(employeeId, updateData);
            toast({ title: 'Tersimpan!', description: `Status BPJS telah diperbarui.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan status BPJS.' });
        }
    });
  }

  const handleIdCardStatusChange = (employeeId: string, value: string) => {
    const updateData: Partial<Employee> = { idCardStatus: value as any };
    // If status is not 'active', clear the number
    if (value !== 'active') {
        updateData.idCardNumber = '';
    }
    
    setEmployees(prev => 
      prev.map(emp => emp.id === employeeId ? { ...emp, ...updateData } : emp)
    );

    startSavingTransition(async () => {
        try {
            await updateEmployee(employeeId, updateData);
            toast({ title: 'Tersimpan!', description: `Status ID Card telah diperbarui.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan status ID Card.' });
        }
    });
  }

  const handleSimperStatusChange = (employeeId: string, value: string) => {
    const updateData: Partial<Employee> = { simperStatus: value as any };
    if (value !== 'active') {
        updateData.simperNumber = '';
    }
    
    setEmployees(prev => 
      prev.map(emp => emp.id === employeeId ? { ...emp, ...updateData } : emp)
    );

    startSavingTransition(async () => {
        try {
            await updateEmployee(employeeId, updateData);
            toast({ title: 'Tersimpan!', description: `Status SIMPER telah diperbarui.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan status SIMPER.' });
        }
    });
  }

  const renderCellContent = (employee: Employee, field: 'bpjs' | 'idCard' | 'simper') => {
      switch(field) {
          case 'bpjs':
              return (
                 <div className="flex flex-col gap-2 w-[250px]">
                    <Select
                        value={employee.bpjsStatus || 'not-registered'}
                        onValueChange={(value) => handleBpjsStatusChange(employee.id, value === 'not-registered' ? '' : value)}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Tidak Aktif</SelectItem>
                            <SelectItem value="not-registered">Belum Terdaftar</SelectItem>
                        </SelectContent>
                    </Select>
                    {employee.bpjsStatus === 'active' && (
                        <>
                            <Select
                                value={employee.bpjsType || ''}
                                onValueChange={(value) => handleSave(employee.id, 'bpjsType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Tipe BPJS" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="miki">BPJS MIKI (Potongan 280.000)</SelectItem>
                                    <SelectItem value="iba">BPJS IBA (Potongan 322.000)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input 
                                placeholder="Nomor BPJS"
                                defaultValue={employee.bpjsNumber}
                                onBlur={(e) => handleSave(employee.id, 'bpjsNumber', e.target.value)}
                            />
                        </>
                    )}
                 </div>
              );
          case 'idCard':
              return (
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Select
                        value={employee.idCardStatus || 'not-registered'}
                        onValueChange={(value) => handleIdCardStatusChange(employee.id, value === 'not-registered' ? '' : value)}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="in-progress">Proses Pendaftaran</SelectItem>
                            <SelectItem value="not-registered">Belum Terdaftar</SelectItem>
                        </SelectContent>
                    </Select>
                    {employee.idCardStatus === 'active' && (
                        <Input 
                            placeholder="Nomor ID Card"
                            defaultValue={employee.idCardNumber}
                            onBlur={(e) => handleSave(employee.id, 'idCardNumber', e.target.value)}
                        />
                    )}
                 </div>
              );
          case 'simper':
              return (
                   <div className="flex flex-col gap-2 w-[200px]">
                    <Select
                        value={employee.simperStatus || 'not-registered'}
                        onValueChange={(value) => handleSimperStatusChange(employee.id, value === 'not-registered' ? '' : value)}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="in-progress">Proses Pendaftaran</SelectItem>
                            <SelectItem value="not-registered">Belum Terdaftar</SelectItem>
                        </SelectContent>
                    </Select>
                    {employee.simperStatus === 'active' && (
                        <Input 
                            placeholder="Nomor SIMPER"
                            defaultValue={employee.simperNumber}
                            onBlur={(e) => handleSave(employee.id, 'simperNumber', e.target.value)}
                        />
                    )}
                 </div>
              );
          default:
              return null;
      }
  }


  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        {Object.entries(stats.employeesByProject).map(([project, count]) => (
                            <div key={project} className="flex justify-between">
                                <span>{project}:</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status BPJS</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Aktif:</span> <Badge variant="secondary">{stats.bpjsStats.active}</Badge></div>
                    {stats.bpjsStats.active > 0 && (
                        <div className="pl-4 text-xs">
                             <div className="flex justify-between"><span>- MIKI:</span> <span>{stats.bpjsStats.types.miki || 0}</span></div>
                             <div className="flex justify-between"><span>- IBA:</span> <span>{stats.bpjsStats.types.iba || 0}</span></div>
                             <div className="flex justify-between"><span>- Lainnya:</span> <span>{stats.bpjsStats.types.unknown || 0}</span></div>
                        </div>
                    )}
                    <div className="flex justify-between"><span>Tidak Aktif:</span> <Badge variant="outline">{stats.bpjsStats.inactive}</Badge></div>
                    <div className="flex justify-between"><span>Belum Terdaftar:</span> <Badge variant="outline">{stats.bpjsStats['not-registered']}</Badge></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status ID Card</CardTitle>
                    <UserSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                 <CardContent className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Aktif:</span> <Badge variant="secondary">{stats.idCardStats.active}</Badge></div>
                    <div className="flex justify-between"><span>Proses:</span> <Badge variant="outline">{stats.idCardStats['in-progress']}</Badge></div>
                    <div className="flex justify-between"><span>Belum Terdaftar:</span> <Badge variant="outline">{stats.idCardStats['not-registered']}</Badge></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status SIMPER</CardTitle>
                    <WalletCards className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Aktif:</span> <Badge variant="secondary">{stats.simperStats.active}</Badge></div>
                    <div className="flex justify-between"><span>Proses:</span> <Badge variant="outline">{stats.simperStats['in-progress']}</Badge></div>
                    <div className="flex justify-between"><span>Belum Terdaftar:</span> <Badge variant="outline">{stats.simperStats['not-registered']}</Badge></div>
                </CardContent>
            </Card>
        </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Data Karyawan</CardTitle>
                        <CardDescription>
                        Detail status BPJS, ID Card, dan SIMPER untuk setiap karyawan. Klik pada kolom untuk mengedit.
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
                <div className="relative">
                {isSaving && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
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
                                <TableCell>{renderCellContent(emp, 'bpjs')}</TableCell>
                                <TableCell>{renderCellContent(emp, 'idCard')}</TableCell>
                                <TableCell>{renderCellContent(emp, 'simper')}</TableCell>
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
                </div>
            </CardContent>
        </Card>
    </div>
  );
}