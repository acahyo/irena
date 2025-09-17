'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Employee } from '@/lib/types';
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
import { PlusCircle, Search, Upload, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


export default function EmployeeDirectoryClientPage({ initialEmployees }: { initialEmployees: Employee[]}) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    // fileInputRef.current?.click();
    toast({
        variant: 'destructive',
        title: 'Feature Disabled',
        description: 'Employee import is temporarily disabled.'
    })
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This function is kept for potential re-enablement but is not currently used.
  };

  return (
    <div className="space-y-6">
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

      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
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
