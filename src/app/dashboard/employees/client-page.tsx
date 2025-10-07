
'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Employee, User } from '@/lib/types';
import { EmployeeCard } from '@/components/employee-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Upload, Download, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { createEmployee, deleteEmployees } from '@/actions/employees';
import { useUser } from '@/contexts/user-context';
import { Checkbox } from '@/components/ui/checkbox';
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
} from "@/components/ui/alert-dialog";


export default function EmployeeDirectoryClientPage({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const user = useUser();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());

  const handleSelectEmployee = (id: string, isSelected: boolean) => {
    setSelectedEmployeeIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    startTransition(async () => {
      try {
        await deleteEmployees(Array.from(selectedEmployeeIds));
        toast({
          title: 'Success!',
          description: `${selectedEmployeeIds.size} employee(s) have been removed.`,
        });
        setSelectedEmployeeIds(new Set());
        // Refresh data from server
        router.refresh();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to remove employees.',
        });
      }
    });
  }


  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);


  const departments = useMemo(() => {
    const allDepartments = employees.map((emp) => emp.department).filter(Boolean);
    return ['all', ...Array.from(new Set(allDepartments as string[]))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee: Employee) => {
      const matchesSearch = employee.name
        ? employee.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      const matchesDepartment =
        departmentFilter === 'all' || employee.department === departmentFilter;
      const matchesStatus =
        statusFilter === 'all' || employee.employeeStatus === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [searchTerm, departmentFilter, statusFilter, employees]);
  
  // When filters change, clear selection
  useEffect(() => {
    setSelectedEmployeeIds(new Set());
  }, [searchTerm, departmentFilter, statusFilter]);

  const handleExport = () => {
    // Remove image data before exporting to prevent errors with long base64 strings
    const employeesForExport = filteredEmployees.map(emp => {
      const { avatar, ktpPhoto, simPhoto, sioPhoto, ...rest } = emp;
      return rest;
    });

    const worksheet = XLSX.utils.json_to_sheet(employeesForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "EmployeeData.xlsx");
     toast({
      title: 'Success!',
      description: 'Employee data has been exported.',
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet) as any[];

            for (const row of json) {
                // Convert date objects to strings before sending to server action
                const processedRow = { ...row };
                const dateFields: (keyof Employee)[] = ['dateOfBirth', 'messEntryDate', 'contractStartDate', 'contractEndDate'];
                dateFields.forEach(field => {
                    if (processedRow[field] instanceof Date) {
                        processedRow[field] = (processedRow[field] as Date).toISOString();
                    }
                });

                await createEmployee(processedRow as Partial<Employee>);
            }
            
            toast({
                title: 'Import Successful',
                description: `${json.length} employee records have been imported.`,
            });
            router.refresh(); // Refresh the page to show new employees

          } catch (readError) {
             toast({
                variant: 'destructive',
                title: 'File Read Error',
                description: 'Failed to read or process the Excel file.',
            });
          } finally {
             if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Import Error',
            description: 'An unexpected error occurred during file processing.',
        });
      }
    });
  };

  if (!user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <div className="space-y-6">
      {user.role === 'Admin Proyek' && (
        <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dasbor
            </Link>
        </Button>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Search by name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <div className="flex flex-wrap gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                    {dept}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                <SelectItem value="resign">Resign</SelectItem>
                <SelectItem value="phk">PHK</SelectItem>
                </SelectContent>
            </Select>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
                disabled={isPending}
            />
            <Button variant="outline" onClick={handleImportClick} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button asChild>
                <Link href="/dashboard/employees/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Employee
                </Link>
            </Button>
            </div>
        </div>
        
        {selectedEmployeeIds.size > 0 && (
          <div className="flex items-center gap-4 bg-muted p-2 rounded-lg">
             <div className="flex items-center gap-2">
                <Checkbox
                    id="select-all-filtered"
                    checked={
                        filteredEmployees.length > 0 &&
                        selectedEmployeeIds.size === filteredEmployees.length
                    }
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <label
                    htmlFor="select-all-filtered"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Pilih Semua ({selectedEmployeeIds.size})
                </label>
            </div>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus yang Dipilih
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Aksi ini tidak dapat dibatalkan. Ini akan menghapus {selectedEmployeeIds.size} catatan karyawan secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lanjutkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

      </div>

      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard 
                key={employee.id} 
                employee={employee}
                isSelected={selectedEmployeeIds.has(employee.id)}
                onSelect={handleSelectEmployee}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-2xl font-bold tracking-tight">No employees found</h3>
            <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria or add a new employee.
            </p>
        </div>
      )}
    </div>
  );
}
