
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const generateContractText = (data: any) => {
    const { 
        employeeName, position, department, 
        startDate, endDate, salary, companyName, 
        companyAddress, employeeAddress 
    } = data;

    const formattedStartDate = startDate ? format(startDate, 'PPP') : '[Tanggal Mulai]';
    const formattedEndDate = endDate ? format(endDate, 'PPP') : '[Tanggal Akhir]';
    const formattedSalary = salary ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(salary) : '[Jumlah Gaji]';

    return `
SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: [Nomor Surat]

Pada hari ini, ${format(new Date(), 'eeee, dd MMMM yyyy')}, yang bertanda tangan di bawah ini:

1. Nama    : [Nama Pimpinan]
   Jabatan : [Jabatan Pimpinan]
   Alamat  : ${companyAddress || '[Alamat Perusahaan]'}
   Dalam hal ini bertindak atas nama ${companyName || '[Nama Perusahaan]'} yang selanjutnya disebut sebagai PIHAK PERTAMA.

2. Nama    : ${employeeName || '[Nama Karyawan]'}
   Alamat  : ${employeeAddress || '[Alamat Karyawan]'}
   Dalam hal ini bertindak atas nama diri pribadi yang selanjutnya disebut sebagai PIHAK KEDUA.

Kedua belah pihak sepakat untuk mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu dengan ketentuan sebagai berikut:

Pasal 1: Jabatan dan Tugas
PIHAK PERTAMA memberikan pekerjaan kepada PIHAK KEDUA sebagai ${position || '[Jabatan]'} di departemen ${department || '[Departemen]'}.

Pasal 2: Jangka Waktu
Perjanjian kerja ini berlaku untuk jangka waktu tertentu, yaitu dimulai sejak tanggal ${formattedStartDate} dan akan berakhir pada tanggal ${formattedEndDate}.

Pasal 3: Gaji dan Tunjangan
PIHAK PERTAMA akan membayarkan gaji pokok kepada PIHAK KEDUA sebesar ${formattedSalary} per bulan.

Pasal 4: Waktu Kerja
Waktu kerja adalah 8 (delapan) jam sehari atau 40 (empat puluh) jam seminggu.

Pasal 5: Berakhirnya Perjanjian
Perjanjian kerja ini akan berakhir demi hukum pada saat jangka waktu perjanjian ini selesai.

Demikian surat perjanjian ini dibuat dengan sesungguhnya dalam keadaan sadar dan tanpa ada paksaan dari pihak manapun.

PIHAK PERTAMA                                  PIHAK KEDUA


[Nama Pimpinan]                                   ${employeeName || '[Nama Karyawan]'}
    `;
};


export default function ContractTemplateClientPage({ employees }: { employees: Employee[] }) {
    const { toast } = useToast();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [contractData, setContractData] = useState<any>({});
    const [generatedContract, setGeneratedContract] = useState<string>('');

    const handleEmployeeChange = (employeeId: string) => {
        setSelectedEmployeeId(employeeId);
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            setContractData({
                ...contractData,
                employeeName: employee.name,
                position: employee.position,
                department: employee.department,
                employeeAddress: employee.address,
                startDate: employee.contractStartDate ? new Date(employee.contractStartDate) : new Date(),
                endDate: employee.contractEndDate ? new Date(employee.contractEndDate) : new Date(),
            });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContractData({ ...contractData, [name]: value });
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        const text = generateContractText(contractData);
        setGeneratedContract(text);
        toast({ title: "Success", description: "Contract has been generated." });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Contract Template Generator</CardTitle>
                    <CardDescription>
                        Fill in the details to generate a work contract.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="employee">Select Employee</Label>
                            <Select onValueChange={handleEmployeeChange} value={selectedEmployeeId}>
                                <SelectTrigger id="employee">
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="position">Position</Label>
                                <Input id="position" name="position" value={contractData.position || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" name="department" value={contractData.department || ''} onChange={handleInputChange} />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="salary">Salary (IDR)</Label>
                            <Input id="salary" name="salary" type="number" value={contractData.salary || ''} onChange={handleInputChange} placeholder="e.g., 5000000" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" name="companyName" value={contractData.companyName || 'PT. Staff Hub Indonesia'} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="companyAddress">Company Address</Label>
                            <Textarea id="companyAddress" name="companyAddress" value={contractData.companyAddress || 'Jl. Jendral Sudirman Kav. 52-53, Jakarta Selatan'} onChange={handleInputChange} />
                        </div>
                        
                        <Button type="submit" className="w-full">
                            Generate Contract
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Generated Contract Preview</CardTitle>
                    <CardDescription>
                        Review the generated contract below. You can copy the text.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        readOnly
                        className="h-[500px] text-sm bg-muted/50"
                        value={generatedContract || "Contract preview will appear here..."}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
