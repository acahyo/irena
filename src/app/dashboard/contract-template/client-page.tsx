
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Copy, Bold, Italic, Underline } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const generateContractText = (data: any) => {
    const { 
        employeeName, position, department, 
        startDate, endDate, salary, companyName, 
        companyAddress, employeeAddress 
    } = data;

    const formattedStartDate = startDate ? format(startDate, 'PPP') : '[Tanggal Mulai]';
    const formattedEndDate = endDate ? format(endDate, 'PPP') : '[Tanggal Akhir]';
    const formattedSalary = salary ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(salary) : '[Jumlah Gaji]';

    // Using paragraphs and strong tags for better semantic structure
    return `
<p style="text-align: center;"><strong>SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)</strong></p>
<p style="text-align: center;">Nomor: [Nomor Surat]</p>
<br>
<p>Pada hari ini, ${format(new Date(), 'eeee, dd MMMM yyyy')}, yang bertanda tangan di bawah ini:</p>
<br>
<p>1. <strong>Nama:</strong> [Nama Pimpinan]</p>
<p>&nbsp;&nbsp;&nbsp;<strong>Jabatan:</strong> [Jabatan Pimpinan]</p>
<p>&nbsp;&nbsp;&nbsp;<strong>Alamat:</strong> ${companyAddress || '[Alamat Perusahaan]'}</p>
<p>&nbsp;&nbsp;&nbsp;Dalam hal ini bertindak atas nama <strong>${companyName || '[Nama Perusahaan]'}</strong> yang selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>
<br>
<p>2. <strong>Nama:</strong> ${employeeName || '[Nama Karyawan]'}</p>
<p>&nbsp;&nbsp;&nbsp;<strong>Alamat:</strong> ${employeeAddress || '[Alamat Karyawan]'}</p>
<p>&nbsp;&nbsp;&nbsp;Dalam hal ini bertindak atas nama diri pribadi yang selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>
<br>
<p>Kedua belah pihak sepakat untuk mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu dengan ketentuan sebagai berikut:</p>
<br>
<p><strong>Pasal 1: Jabatan dan Tugas</strong></p>
<p>PIHAK PERTAMA memberikan pekerjaan kepada PIHAK KEDUA sebagai <strong>${position || '[Jabatan]'}</strong> di departemen <strong>${department || '[Departemen]'}</strong>.</p>
<br>
<p><strong>Pasal 2: Jangka Waktu</strong></p>
<p>Perjanjian kerja ini berlaku untuk jangka waktu tertentu, yaitu dimulai sejak tanggal ${formattedStartDate} dan akan berakhir pada tanggal ${formattedEndDate}.</p>
<br>
<p><strong>Pasal 3: Gaji dan Tunjangan</strong></p>
<p>PIHAK PERTAMA akan membayarkan gaji pokok kepada PIHAK KEDUA sebesar <strong>${formattedSalary}</strong> per bulan.</p>
<br>
<p><strong>Pasal 4: Waktu Kerja</strong></p>
<p>Waktu kerja adalah 8 (delapan) jam sehari atau 40 (empat puluh) jam seminggu.</p>
<br>
<p><strong>Pasal 5: Berakhirnya Perjanjian</strong></p>
<p>Perjanjian kerja ini akan berakhir demi hukum pada saat jangka waktu perjanjian ini selesai.</p>
<br>
<p>Demikian surat perjanjian ini dibuat dengan sesungguhnya dalam keadaan sadar dan tanpa ada paksaan dari pihak manapun.</p>
<br>
<br>
<div style="display: flex; justify-content: space-between;">
    <div style="text-align: center;">
        <p><strong>PIHAK PERTAMA</strong></p>
        <br><br><br>
        <p><strong>[Nama Pimpinan]</strong></p>
    </div>
    <div style="text-align: center;">
        <p><strong>PIHAK KEDUA</strong></p>
        <br><br><br>
        <p><strong>${employeeName || '[Nama Karyawan]'}</strong></p>
    </div>
</div>
    `;
};


export default function ContractTemplateClientPage({ employees }: { employees: Employee[] }) {
    const { toast } = useToast();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [contractData, setContractData] = useState<any>({});
    const [generatedContract, setGeneratedContract] = useState<string>('');
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (generatedContract && editorRef.current) {
            editorRef.current.innerHTML = generatedContract;
        }
    }, [generatedContract]);


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

    const handleCopy = () => {
        if (editorRef.current) {
            // Use innerText to get a clean text representation
            navigator.clipboard.writeText(editorRef.current.innerText);
            toast({ title: "Success", description: "Contract copied to clipboard." });
        }
    };
    
    const applyFormat = (command: string) => {
        document.execCommand(command, false);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
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

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Contract</CardTitle>
                        <CardDescription>
                           Review and edit the generated contract below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted rounded-t-lg border-b border-border p-2 flex items-center gap-2">
                             <Button variant="ghost" size="icon" onClick={() => applyFormat('bold')}><Bold /></Button>
                             <Button variant="ghost" size="icon" onClick={() => applyFormat('italic')}><Italic /></Button>
                             <Button variant="ghost" size="icon" onClick={() => applyFormat('underline')}><Underline /></Button>
                             <Separator orientation="vertical" className="h-6 mx-2" />
                             <Button onClick={handleCopy} disabled={!generatedContract} variant="ghost" className="ml-auto">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                            </Button>
                        </div>

                         <div className="bg-background p-4 rounded-b-lg">
                            <div 
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning // Suppress warning as we manage the content
                                className="bg-white max-w-3xl mx-auto p-12 shadow-lg rounded-sm min-h-[700px] prose prose-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {!generatedContract && <p className="text-muted-foreground">Contract preview will appear here...</p>}
                            </div>
                        </div>
                        
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

