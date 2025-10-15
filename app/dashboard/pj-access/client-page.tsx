'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { updateEmployee } from '@/actions/employees';
import type { Employee } from '@/lib/types';

const PJ_ROLE = 'PJ';

export default function PjAccessClientPage({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleAccessChange = (employeeId: string, checked: boolean) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const currentPositions = employee.positions || [];
    let updatedPositions: string[];

    if (checked) {
      if (!currentPositions.includes(PJ_ROLE)) {
        updatedPositions = [...currentPositions, PJ_ROLE];
      } else {
        return; // No change needed
      }
    } else {
      updatedPositions = currentPositions.filter(p => p !== PJ_ROLE);
    }
    
    // Optimistically update UI
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId ? { ...emp, positions: updatedPositions } : emp
      )
    );

    startTransition(async () => {
      try {
        await updateEmployee(employeeId, { positions: updatedPositions });
        toast({
          title: 'Sukses!',
          description: `Hak akses PJ untuk ${employee.name} telah diperbarui.`,
        });
      } catch (error) {
        // Revert UI on error
        setEmployees(prev =>
            prev.map(emp =>
                emp.id === employeeId ? { ...emp, positions: currentPositions } : emp
            )
        );
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Gagal memperbarui hak akses untuk ${employee.name}.`,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <CardTitle>Hak Akses PJ (Penanggung Jawab)</CardTitle>
                <CardDescription>
                Atur karyawan mana yang memiliki akses ke dasbor khusus "PJ".
                </CardDescription>
            </div>
            <Input
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead className="text-right">Akses PJ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={emp.avatar} alt={emp.name} />
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.nik}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.positions?.filter(p => p !== PJ_ROLE).join(', ') || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <Switch
                        id={`pj-access-${emp.id}`}
                        checked={emp.positions?.includes(PJ_ROLE)}
                        onCheckedChange={(checked) => handleAccessChange(emp.id, checked)}
                        disabled={isPending}
                        aria-label="PJ Access"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Tidak ada karyawan ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
