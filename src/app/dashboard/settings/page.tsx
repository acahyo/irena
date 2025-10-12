

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Download, ShieldCheck, Archive, ArrowUp, ArrowDown, PlusCircle } from 'lucide-react';
import { getSettings, saveSettings } from '@/actions/settings';
import type { AppSettings, Role, MenuOrderItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDepartments } from '@/actions/departments';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import { getPositions } from '@/actions/positions';
import { getRoles, updateRolePermissions } from '@/actions/roles';
import { getUsers } from '@/actions/users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';


// Helper to convert hex to HSL string
const hexToHslString = (hex: string | undefined): string | undefined => {
    if (!hex) return undefined;
    hex = hex.replace(/^#/, '');
    // Handle short hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
};

const allMenus = [
  { id: 'dashboard', label: 'Dasbor' },
  { id: 'recruitment-dashboard', label: 'Dasbor Rekrutmen' },
  { id: 'finance-dashboard', label: 'Dasbor Keuangan' },
  { id: 'hse-dashboard', label: 'Dasbor HSE' },
  { id: 'disciplinary-dashboard', label: "Dasbor Disipliner" },
  { id: 'employees', label: 'Daftar Karyawan' },
  { id: 'employee-register', label: "Registrasi Karyawan" },
  { id: 'employee-review', label: "Tinjau Registrasi" },
  { id: 'candidate-data', label: 'Data Kandidat' },
  { id: 'leave-schedule', label: 'Jadwal Cuti' },
  { id: 'separations', label: 'Proses Resign/PHK' },
  { id: 'separations-review', label: 'Tinjau PHK' },
  { id: 'bpjs-id-simper', label: 'BPJS, ID & SIMPER' },
  { id: 'violations', label: 'Catatan Pelanggaran' },
  { id: 'attendance', label: 'Input Absensi' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'payslip', label: 'Cetak Slip Gaji' },
  { id: 'payslip-collective', label: 'Slip Gaji Kolektif' },
  { id: 'payroll-history', label: 'Riwayat Payroll' },
  { id: 'purchasing', label: "Pengajuan Barang" },
  { id: 'warehouse', label: "Gudang" },
  { id: 'finance', label: 'Laporan Transaksi' },
  { id: 'payment-requests', label: "Pengajuan Pembayaran" },
  { id: 'fuel-requests', label: "Pengajuan BBM" },
  { id: 'koperasi-limit', label: "Limit Koperasi" },
  { id: 'reports', label: "Laporan" },
  { id: 'koperasi-items', label: "Barang Koperasi" },
  { id: 'koperasi-orders', label: "Pesanan Koperasi" },
  { id: 'vehicles', label: 'Kendaraan' },
  { id: 'driver-attendance', label: 'Absensi Driver' },
  { id: 'pj-attendance', label: 'Absensi PJ' },
  { id: 'hse', label: 'Report HSE' },
  { id: 'hse-fines', label: 'Pengaturan Denda' },
  { id: 'department', label: 'Departemen' },
  { id: 'position', label: 'Jabatan & Gaji' },
  { id: 'project', label: "Proyek" },
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles & Hak Akses' },
  { id: 'driver-access', label: 'Hak Akses Driver' },
  { id: 'pj-access', label: "Hak Akses PJ" },
  { id: 'settings', label: 'Pengaturan' },
];



export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<Omit<AppSettings, 'id'> | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | undefined | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | undefined | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [employeePayslipAccess, setEmployeePayslipAccess] = useState(true);
    const [menuOrder, setMenuOrder] = useState<MenuOrderItem[]>([]);
    const [savingMenu, setSavingMenu] = useState(false);
    const [menuToAdd, setMenuToAdd] = useState('');


    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const [settingsData, rolesData] = await Promise.all([getSettings(), getRoles()]);
                
                const { logo, favicon, id, menuOrder: initialMenuOrder, ...rest } = settingsData;
                setSettings(rest);
                setLogoPreview(logo);
                setFaviconPreview(favicon);
                setEmployeePayslipAccess(settingsData.employeePayslipAccess ?? true);
                
                const allMenuIds = allMenus.map(m => m.id);
                const currentMenuOrder = initialMenuOrder && initialMenuOrder.length > 0 
                    ? initialMenuOrder 
                    : allMenuIds.map(id => ({ id }));
                
                const ordered = currentMenuOrder
                    .map(item => allMenus.find(m => m.id === item.id))
                    .filter(Boolean) as {id: string, label: string}[];

                setMenuOrder(ordered.map(m => ({ id: m.id })));
                
                setRoles(rolesData);
                const initialPermissions: Record<string, string[]> = {};
                rolesData.forEach(role => {
                    initialPermissions[role.id] = role.accessibleMenus || [];
                });
                setPermissions(initialPermissions);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch settings data.' });
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);
    
    const lang = settings?.language || 'id';

    const availableMenusToAdd = useMemo(() => {
        const currentMenuIds = new Set(menuOrder.map(item => item.id));
        return allMenus.filter(menu => !currentMenuIds.has(menu.id));
    }, [menuOrder]);
    
    const handleAddMenu = () => {
        if (menuToAdd) {
            setMenuOrder(prev => [...prev, { id: menuToAdd }]);
            setMenuToAdd('');
        }
    };

    const handlePermissionChange = (roleId: string, menuId: string, checked: boolean) => {
        setPermissions(prev => {
            const currentMenus = prev[roleId] || [];
            const newMenus = checked
                ? [...currentMenus, menuId]
                : currentMenus.filter(id => id !== menuId);
            return { ...prev, [roleId]: newMenus };
        });
    };
    
    const moveMenuItem = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...menuOrder];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < newOrder.length) {
            [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
            setMenuOrder(newOrder);
        }
    };
    
    const handleSaveMenuOrder = async () => {
        setSavingMenu(true);
        try {
            await saveSettings({ ...settings, menuOrder: menuOrder });
            toast({ title: 'Success!', description: 'Menu order has been saved.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save menu order.' });
        } finally {
            setSavingMenu(false);
        }
    };

    const handleSavePermissions = async () => {
        setSavingPermissions(true);
        try {
            const updates = Object.entries(permissions).map(([roleId, accessibleMenus]) => ({
                roleId,
                accessibleMenus,
            }));
            await updateRolePermissions(updates);
            toast({
                title: 'Success!',
                description: lang === 'id' ? 'Hak akses menu telah diperbarui.' : 'Menu permissions have been updated.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: lang === 'id' ? 'Gagal menyimpan hak akses.' : 'Failed to save permissions.',
            });
        } finally {
            setSavingPermissions(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null | undefined>>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
             setPreview(null);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : { [name]: value } as AppSettings);
    }
    
    const handleSelectChange = (name: keyof AppSettings, value: string) => {
        setSettings(prev => prev ? { ...prev, [name]: value } : { [name]: value } as AppSettings);
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!settings) return;
        setLoading(true);
        
        try {
            const settingsToSave: Omit<AppSettings, 'id'> = {
                ...settings,
                logo: logoPreview || '',
                favicon: faviconPreview || '',
                employeePayslipAccess,
                menuOrder,
            };

            await saveSettings(settingsToSave);

            const root = document.documentElement;
            if (settings.primaryColor) root.style.setProperty('--primary', hexToHslString(settings.primaryColor) || '');
            if (settings.backgroundColor) root.style.setProperty('--background', hexToHslString(settings.backgroundColor) || '');
            if (settings.accentColor) root.style.setProperty('--accent', hexToHslString(settings.accentColor) || '');

            toast({
                title: 'Success!',
                description: 'Settings have been saved.',
            });
            window.location.reload();
        } catch(error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save settings.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackup = async () => {
        setDownloading(true);
        toast({
            title: 'Preparing Download',
            description: 'Fetching all data from the database. This may take a moment...',
        });

        try {
            const zip = new JSZip();
            
            const [
                departments, 
                employees, 
                leaveRequests, 
                positions, 
                rolesData, 
                users, 
                appSettings
            ] = await Promise.all([
                getDepartments(),
                getEmployees(),
                getLeaveRequests(),
                getPositions(),
                getRoles(),
                getUsers(),
                getSettings()
            ]);

            zip.file("departments.json", JSON.stringify(departments, null, 2));
            zip.file("employees.json", JSON.stringify(employees, null, 2));
            zip.file("leaveRequests.json", JSON.stringify(leaveRequests, null, 2));
            zip.file("positions.json", JSON.stringify(positions, null, 2));
            zip.file("roles.json", JSON.stringify(rolesData, null, 2));
            zip.file("users.json", JSON.stringify(users, null, 2));
            zip.file("settings.json", JSON.stringify(appSettings, null, 2));

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "firestore-backup.zip");

            toast({
                title: 'Success!',
                description: 'Database backup has been downloaded.',
            });
        } catch (error) {
            console.error("Backup failed:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to download data backup.',
            });
        } finally {
            setDownloading(false);
        }
    };

    const ColorInput = ({ label, id, value, onChange }: { label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    name={id}
                    value={value}
                    onChange={onChange}
                    className="max-w-xs"
                />
                <Input type="color" value={value} onChange={onChange} className="h-10 w-10 p-1 border rounded-md" />
            </div>
             <p className="text-sm text-muted-foreground">
                Enter a valid hex color code (e.g., #136F63).
            </p>
        </div>
    );
    

    if (pageLoading || !settings) {
        return (
             <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-60" />
                        <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-8">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-7 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </CardContent>
                            </Card>
                             <div className="flex justify-end pt-4">
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{lang === 'id' ? 'Pengaturan Aplikasi' : 'Application Settings'}</CardTitle>
                        <CardDescription>
                            {lang === 'id' ? 'Kelola branding dan tampilan aplikasi Anda.' : 'Manage your application\'s branding and appearance.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-2">
                            <Label>{lang === 'id' ? 'Logo Aplikasi' : 'Application Logo'}</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-24 w-24 rounded-md">
                                    <AvatarImage src={logoPreview || undefined} alt="App Logo" className="object-contain" />
                                    <AvatarFallback className="rounded-md">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <Input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, setLogoPreview)}
                                    className="max-w-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>{lang === 'id' ? 'Favicon & Ikon Shortcut' : 'Favicon & Shortcut Icon'}</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 rounded-md">
                                    <AvatarImage src={faviconPreview || undefined} alt="Favicon" className="object-contain" />
                                    <AvatarFallback className="rounded-md">
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <Input
                                    id="favicon"
                                    name="favicon"
                                    type="file"
                                    accept="image/png, image/x-icon, image/svg+xml"
                                    onChange={(e) => handleFileChange(e, setFaviconPreview)}
                                    className="max-w-sm"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">Gunakan file .png atau .ico untuk hasil terbaik. Disarankan ukuran 512x512 piksel.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="appName">{lang === 'id' ? 'Nama Aplikasi' : 'Application Name'}</Label>
                                <Input id="appName" name="appName" value={settings.appName || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">{lang === 'id' ? 'Bahasa' : 'Language'}</Label>
                                <Select value={settings.language || 'id'} onValueChange={(value) => handleSelectChange('language', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="appDescription">{lang === 'id' ? 'Deskripsi Aplikasi' : 'Application Description'}</Label>
                            <Textarea id="appDescription" name="appDescription" value={settings.appDescription || ''} onChange={handleInputChange} />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>{lang === 'id' ? 'Warna Tema' : 'Theme Colors'}</CardTitle>
                                <CardDescription>
                                   {lang === 'id' ? 'Perubahan akan diterapkan di seluruh aplikasi setelah disimpan.' : 'Changes will be applied application-wide after saving.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <ColorInput label={lang === 'id' ? 'Warna Primer' : 'Primary Color'} id="primaryColor" value={settings.primaryColor || '#136F63'} onChange={handleInputChange} />
                               <ColorInput label={lang === 'id' ? 'Warna Latar' : 'Background Color'} id="backgroundColor" value={settings.backgroundColor || '#D2E9E6'} onChange={handleInputChange} />
                               <ColorInput label={lang === 'id' ? 'Warna Aksen' : 'Accent Color'} id="accentColor" value={settings.accentColor || '#877795'} onChange={handleInputChange} />
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle>{lang === 'id' ? 'Pengaturan Portal Karyawan' : 'Employee Portal Settings'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <Label htmlFor="employee-payslip-access" className="text-base">
                                      {lang === 'id' ? 'Akses Slip Gaji Karyawan' : 'Employee Payslip Access'}
                                    </Label>
                                    <CardDescription>
                                      {lang === 'id' ? 'Jika dinonaktifkan, karyawan tidak akan melihat menu "Slip Gaji Saya" di portal mereka.' : 'If disabled, employees will not see the "My Payslip" menu in their portal.'}
                                    </CardDescription>
                                  </div>
                                  <Switch
                                    id="employee-payslip-access"
                                    checked={employeePayslipAccess}
                                    onCheckedChange={setEmployeePayslipAccess}
                                  />
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                         <CardTitle>Pengaturan Urutan Menu</CardTitle>
                        <CardDescription>Seret dan lepas untuk mengatur ulang urutan menu di sidebar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border rounded-md">
                          {menuOrder.map((item, index) => {
                            const menuItem = allMenus.find(m => m.id === item.id);
                            if (!menuItem) return null;
                            return (
                                <div key={item.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                    <span className="font-medium">{menuItem.label}</span>
                                    <div className="flex gap-1">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => moveMenuItem(index, 'up')} disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => moveMenuItem(index, 'down')} disabled={index === menuOrder.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                          })}
                        </div>
                         {availableMenusToAdd.length > 0 && (
                            <div className="flex items-center gap-2 pt-4">
                                <Select value={menuToAdd} onValueChange={setMenuToAdd}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih menu untuk ditambahkan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableMenusToAdd.map(menu => (
                                            <SelectItem key={menu.id} value={menu.id}>{menu.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleAddMenu} disabled={!menuToAdd}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Tambah Menu
                                </Button>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button type="button" onClick={handleSaveMenuOrder} disabled={savingMenu}>
                                {savingMenu && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Urutan Menu
                            </Button>
                        </div>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck /> {lang === 'id' ? 'Hak Akses Menu Peran' : 'Role Menu Access'}
                        </CardTitle>
                        <CardDescription>
                            {lang === 'id' ? 'Atur menu mana yang dapat diakses oleh setiap peran pengguna. Peran Administrator selalu memiliki akses penuh.' : 'Set which menus are accessible to each user role. The Administrator role always has full access.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {roles.filter(r => r.name.toLowerCase() !== 'administrator').map(role => (
                            <div key={role.id} className="border p-4 rounded-md">
                                <h4 className="font-semibold mb-3">{role.name}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allMenus.map(menu => (
                                        <div key={menu.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${role.id}-${menu.id}`}
                                                checked={permissions[role.id]?.includes(menu.id)}
                                                onCheckedChange={(checked) => handlePermissionChange(role.id, menu.id, !!checked)}
                                            />
                                            <Label htmlFor={`${role.id}-${menu.id}`} className="font-normal cursor-pointer">
                                                {menu.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4">
                            <Button type="button" onClick={handleSavePermissions} disabled={savingPermissions}>
                                {savingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {lang === 'id' ? 'Simpan Hak Akses' : 'Save Permissions'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>{lang === 'id' ? 'Cadangan Data' : 'Data Backup'}</CardTitle>
                        <CardDescription>
                            {lang === 'id' ? 'Unduh semua data dari database Firestore sebagai file .zip yang berisi file JSON untuk setiap koleksi.' : 'Download all data from the Firestore database as a .zip file containing JSON files for each collection.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button type="button" onClick={handleDownloadBackup} disabled={downloading}>
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {downloading ? (lang === 'id' ? 'Mengunduh...' : 'Downloading...') : (lang === 'id' ? 'Unduh Cadangan Data (JSON)' : 'Download Data Backup (JSON)')}
                        </Button>
                    </CardContent>
                </Card>
                
                <div className="flex justify-end pt-4 sticky bottom-0 bg-background/80 py-4 backdrop-blur-sm">
                    <Button type="submit" disabled={loading || savingPermissions || savingMenu}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {lang === 'id' ? 'Simpan Semua Pengaturan' : 'Save All Settings'}
                    </Button>
                </div>
              </div>
            </form>
        </div>
    );
}
