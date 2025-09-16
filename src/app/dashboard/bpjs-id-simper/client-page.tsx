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
import { Pencil, Loader2 } from 'lucide-react';
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
                description: `Data ${field} untuk ${employee.name} telah diperbarui.`,
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
    // If status is not 'active', clear the number and type
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

  const renderCellContent = (employee: Employee, field: 'bpjs' | 'idCard' | 'simper') => {
      switch(field) {
          case 'bpjs':
              return (
                 <div className="flex flex-col gap-2 w-[200px]">
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
                        <Input 
                            placeholder="Nomor BPJS"
                            defaultValue={employee.bpjsNumber}
                            onBlur={(e) => handleSave(employee.id, 'bpjsNumber', e.target.value)}
                        />
                    )}
                 </div>
              );
          case 'idCard':
              return (
                  <div className="w-[200px]">
                    <Input
                        placeholder="Nomor ID Card"
                        defaultValue={employee.idCardNumber}
                        onBlur={(e) => handleSave(employee.id, 'idCardNumber', e.target.value)}
                    />
                  </div>
              );
          case 'simper':
              return (
                   <div className="w-[200px]">
                    <Input
                        placeholder="Nomor SIMPER"
                        defaultValue={employee.simperNumber}
                        onBlur={(e) => handleSave(employee.id, 'simperNumber', e.target.value)}
                    />
                   </div>
              );
          default:
              return null;
      }
  }


  return (
    <div className="space-y-6">
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
