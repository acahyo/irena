
'use client';

import { useState, useRef, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
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
import { Copy, Bold, Italic, Underline, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import * as mammoth from 'mammoth';

const generateContractText = (data: any) => {
    const { 
        employeeName, position, department, 
        startDate, endDate, salary, companyName, 
        companyAddress, employeeAddress, placeOfBirth, dateOfBirth, gender
    } = data;

    const formattedStartDate = startDate ? format(new Date(startDate), 'PPP') : '[Tanggal Mulai]';
    const formattedEndDate = endDate ? format(new Date(endDate), 'PPP') : '[Tanggal Akhir]';
    const formattedSalary = salary ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(salary) : '[Jumlah Gaji]';
    const formattedDateOfBirth = dateOfBirth ? format(new Date(dateOfBirth), 'PPP') : '[Tanggal Lahir]';
    
    let contractDuration = '[Jumlah Hari]';
    if (startDate && endDate) {
        contractDuration = `${differenceInDays(new Date(endDate), new Date(startDate))} hari`;
    }

    // Using paragraphs and strong tags for better semantic structure
    return `
<p style="text-align: center;"><strong><u>SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)</u></strong></p>
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
<p>&nbsp;&nbsp;&nbsp;<strong>Tempat, Tanggal Lahir:</strong> ${placeOfBirth || '[Tempat Lahir]'}, ${formattedDateOfBirth}</p>
<p>&nbsp;&nbsp;&nbsp;<strong>Jenis Kelamin:</strong> ${gender || '[Jenis Kelamin]'}</p>
<p>&nbsp;&nbsp;&nbsp;<strong>Alamat:</strong> ${employeeAddress || '[Alamat Karyawan]'}</p>
<p>&nbsp;&nbsp;&nbsp;Dalam hal ini bertindak atas nama diri pribadi yang selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>
<br>
<p>Kedua belah pihak sepakat untuk mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu dengan ketentuan sebagai berikut:</p>
<br>
<table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead style="background-color: #f2f2f2;">
        <tr>
            <th style="padding: 8px; text-align: left;" colspan="2">DETAIL KONTRAK</th>
        </tr>
    </thead>
    <tbody>
        <tr><td style="padding: 8px; width: 30%;"><strong>Nama</strong></td><td style="padding: 8px;">${employeeName || '[Nama Karyawan]'}</td></tr>
        <tr><td style="padding: 8px;"><strong>Tempat, Tanggal Lahir</strong></td><td style="padding: 8px;">${placeOfBirth || '[Tempat Lahir]'}, ${formattedDateOfBirth}</td></tr>
        <tr><td style="padding: 8px;"><strong>Jenis Kelamin</strong></td><td style="padding: 8px;">${gender || '[Jenis Kelamin]'}</td></tr>
        <tr><td style="padding: 8px;"><strong>Alamat</strong></td><td style="padding: 8px;">${employeeAddress || '[Alamat Karyawan]'}</td></tr>
        <tr><td style="padding: 8px;"><strong>Jabatan</strong></td><td style="padding: 8px;">${position || '[Jabatan]'}</td></tr>
        <tr><td style="padding: 8px;"><strong>Hari Kontrak</strong></td><td style="padding: 8px;">${contractDuration}</td></tr>
        <tr><td style="padding: 8px;"><strong>Tanggal Mulai Kontrak</strong></td><td style="padding: 8px;">${formattedStartDate}</td></tr>
        <tr><td style="padding: 8px;"><strong>Tanggal Akhir Kontrak</strong></td><td style="padding: 8px;">${formattedEndDate}</td></tr>
        <tr><td style="padding: 8px;"><strong>Upah Pokok</strong></td><td style="padding: 8px;">${formattedSalary}</td></tr>
        <tr><td style="padding: 8px;"><strong>Lemburan</strong></td><td style="padding: 8px;">[Sesuai Peraturan Perusahaan]</td></tr>
    </tbody>
</table>
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                placeOfBirth: employee.placeOfBirth,
                dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined,
                gender: employee.gender,
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

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        if (file.name.endsWith('.docx')) {
            reader.onload = (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        if (editorRef.current) {
                            editorRef.current.innerHTML = result.value;
                            setGeneratedContract(result.value);
                            toast({
                                title: 'Template Loaded',
                                description: `Template from ${file.name} has been loaded.`,
                            });
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        toast({
                            variant: "destructive",
                            title: 'Error',
                            description: 'Could not convert .docx file.',
                        });
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (editorRef.current) {
                    editorRef.current.innerHTML = content;
                    setGeneratedContract(content);
                    toast({
                        title: 'Template Loaded',
                        description: `Template from ${file.name} has been loaded.`,
                    });
                }
            };
            reader.readAsText(file);
        }
    };

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
                             <Button variant="ghost" size="icon" onClick={() => applyFormat('bold')}><Bold className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => applyFormat('italic')}><Italic className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => applyFormat('underline')}><Underline className="h-4 w-4" /></Button>
                             <Separator orientation="vertical" className="h-6 mx-2" />
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".txt,.html,.docx"
                            />
                            <Button variant="ghost" size="sm" onClick={handleUploadClick}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Template
                            </Button>
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
