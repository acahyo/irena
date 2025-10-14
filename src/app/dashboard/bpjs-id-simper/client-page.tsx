
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
import { Pencil, Loader2, Users, ShieldCheck, UserSquare, WalletCards, Save, Upload } from 'lucide-react';
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
import { Button } from '@/components/ui/button';


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
  
  const [dirtyFields, setDirtyFields] = useState<Record<string, Set<keyof Employee>>>({});
  
  const markDirty = (employeeId: string, field: keyof Employee) => {
    setDirtyFields(prev => {
        const newDirty = { ...prev };
        if (!newDirty[employeeId]) {
            newDirty[employeeId] = new Set();
        }
        newDirty[employeeId].add(field);
        return newDirty;
    });
  };

  const isDirty = (employeeId: string) => {
      return dirtyFields[employeeId] && dirtyFields[employeeId].size > 0;
  }

  const clearDirty = (employeeId: string) => {
      setDirtyFields(prev => {
          const newDirty = { ...prev };
          delete newDirty[employeeId];
          return newDirty;
      });
  }


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
    }, { 'active': 0, 'in-progress': 0, 'not-registered': 0, types: {} as Record<string, number> });

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
      const matchesPosition = positionFilter === 'all' || emp.positions?.includes(positionFilter);
      return matchesProject && matchesPosition;
    });
  }, [employees, projectFilter, positionFilter]);

  const handleFieldChange = (employeeId: string, field: keyof Employee, value: any) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId ? { ...emp, [field]: value } : emp
      )
    );
    markDirty(employeeId, field);
  };
  
    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        employeeId: string,
        field: 'ktpPhoto' | 'simPhoto'
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                handleFieldChange(employeeId, field, e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

  const handleSave = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !dirtyFields[employeeId]) return;

    // Validation
    if (employee.idCardStatus === 'active' && (!employee.idCardNumber || !employee.ktpPhoto)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Nomor ID Card dan Foto KTP wajib diisi untuk status Aktif.'});
        return;
    }
    if (employee.simperStatus === 'active' && (!employee.simperNumber || !employee.simPhoto)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Nomor SIMPER dan Foto SIM wajib diisi untuk status Aktif.'});
        return;
    }

    const updates: Partial<Employee> = {};
    dirtyFields[employeeId].forEach(field => {
        (updates as any)[field] = (employee as any)[field];
    });

    startSavingTransition(async () => {
        try {
            await updateEmployee(employeeId, updates);
            toast({
                title: 'Tersimpan!',
                description: `Data untuk ${employee.name} telah diperbarui.`,
            });
            clearDirty(employeeId);
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: `Gagal menyimpan data untuk ${employee.name}.`,
            });
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
    markDirty(employeeId, 'bpjsStatus');
    markDirty(employeeId, 'bpjsNumber');
    markDirty(employeeId, 'bpjsType');
  }

  const handleIdCardStatusChange = (employeeId: string, value: string) => {
    const updateData: Partial<Employee> = { idCardStatus: value as any };
    if (value !== 'active') {
        updateData.idCardNumber = '';
        updateData.ktpPhoto = ''; // Clear photo if not active
    }
    setEmployees(prev => 
      prev.map(emp => emp.id === employeeId ? { ...emp, ...updateData } : emp)
    );
    markDirty(employeeId, 'idCardStatus');
  }

  const handleSimperStatusChange = (employeeId: string, value: string) => {
    const updateData: Partial<Employee> = { simperStatus: value as any };
    if (value !== 'active') {
        updateData.simperNumber = '';
        updateData.simPhoto = ''; // Clear photo if not active
    }
    setEmployees(prev => 
      prev.map(emp => emp.id === employeeId ? { ...emp, ...updateData } : emp)
    );
    markDirty(employeeId, 'simperStatus');
  }

  const renderCellContent = (employee: Employee, field: 'bpjs' | 'idCard' | 'simper') => {
      switch(field) {
          case 'bpjs':
              return (
                 <div className="flex flex-col gap-2 w-full md:w-[250px]">
                    <Select
                        value={employee.bpjsStatus || 'not-registered'}
                        onValueChange={(value) => handleBpjsStatusChange(employee.id, value === 'not-registered' ? '' : value)}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="in-progress">Proses Pendaftaran</SelectItem>
                            <SelectItem value="not-registered">Belum Terdaftar</SelectItem>
                        </SelectContent>
                    </Select>
                    {employee.bpjsStatus === 'active' && (
                        <>
                            <Select
                                value={employee.bpjsType || ''}
                                onValueChange={(value) => handleFieldChange(employee.id, 'bpjsType', value)}
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
                                value={employee.bpjsNumber || ''}
                                onChange={(e) => handleFieldChange(employee.id, 'bpjsNumber', e.target.value)}
                            />
                        </>
                    )}
                 </div>
              );
          case 'idCard':
              return (
                  <div className="flex flex-col gap-2 w-full md:w-[250px]">
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
                        <>
                            <Input 
                                placeholder="Nomor ID Card"
                                value={employee.idCardNumber || ''}
                                onChange={(e) => handleFieldChange(employee.id, 'idCardNumber', e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 rounded-md">
                                    <AvatarImage src={employee.ktpPhoto || undefined} alt="KTP" className="object-contain" />
                                    <AvatarFallback className="rounded-md"><Upload className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, employee.id, 'ktpPhoto')} className="text-xs" />
                            </div>
                        </>
                    )}
                 </div>
              );
          case 'simper':
              return (
                   <div className="flex flex-col gap-2 w-full md:w-[250px]">
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
                        <>
                            <Input 
                                placeholder="Nomor SIMPER"
                                value={employee.simperNumber || ''}
                                onChange={(e) => handleFieldChange(employee.id, 'simperNumber', e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 rounded-md">
                                    <AvatarImage src={employee.simPhoto || undefined} alt="SIM" className="object-contain" />
                                    <AvatarFallback className="rounded-md"><Upload className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, employee.id, 'simPhoto')} className="text-xs" />
                            </div>
                        </>
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
                    <div className="flex justify-between"><span>Proses Pendaftaran:</span> <Badge variant="outline">{stats.bpjsStats['in-progress']}</Badge></div>
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
                <div className="relative overflow-x-auto">
                {isSaving && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-card min-w-[250px]">Nama Karyawan</TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead>Jabatan</TableHead>
                            <TableHead>BPJS</TableHead>
                            <TableHead>ID Card</TableHead>
                            <TableHead>SIMPER</TableHead>
                            <TableHead className="sticky right-0 bg-card">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell className="sticky left-0 bg-card font-medium">
                                     <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={emp.avatar} alt={emp.name} />
                                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p>{emp.name}</p>
                                            <p className="text-sm text-muted-foreground">{emp.nik}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{emp.siteLocation || 'N/A'}</TableCell>
                                <TableCell>{(emp.positions || []).join(', ') || 'N/A'}</TableCell>
                                <TableCell>{renderCellContent(emp, 'bpjs')}</TableCell>
                                <TableCell>{renderCellContent(emp, 'idCard')}</TableCell>
                                <TableCell>{renderCellContent(emp, 'simper')}</TableCell>
                                <TableCell className="sticky right-0 bg-card">
                                    {isDirty(emp.id) && (
                                        <Button size="sm" onClick={() => handleSave(emp.id)} disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            <Save className="mr-2 h-4 w-4"/>
                                            Simpan
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredEmployees.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
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

    

    