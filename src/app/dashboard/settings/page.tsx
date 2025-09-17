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
import { Loader2, Upload, Download, ShieldCheck, GripVertical, PlusCircle, Trash2, Database, WalletCards, ShoppingCart } from 'lucide-react';
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
  { id: 'employees', label: 'Karyawan' },
  { id: 'leave-schedule', label: 'Jadwal Cuti' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'attendance', label: 'Input Absensi' },
  { id: 'payslip', label: 'Cetak Slip Gaji' },
  { id: 'payslip-collective', label: 'Slip Gaji Kolektif' },
  { id: 'purchasing', label: 'Purchasing' },
  { id: 'bpjs-id-simper', label: 'BPJS-ID-SIMPER' },
  { id: 'department', label: 'Departemen' },
  { id: 'position', label: 'Jabatan & Gaji' },
  { id: 'project', label: 'Proyek' },
  { id: 'finance', label: 'Keuangan' },
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
  { id: 'settings', label: 'Pengaturan' },
  { id: 'employee-register', label: 'Registrasi Karyawan'},
];


export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<Omit<AppSettings, 'logo' | 'id'> | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | undefined | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [menuOrder, setMenuOrder] = useState<MenuOrderItem[]>([]);
    const [draggedItem, setDraggedItem] = useState<MenuOrderItem | null>(null);
    const [employeePayslipAccess, setEmployeePayslipAccess] = useState(true);


    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const [settingsData, rolesData] = await Promise.all([getSettings(), getRoles()]);
                
                const { logo, id, ...rest } = settingsData;
                setSettings(rest);
                setLogoPreview(logo);
                setEmployeePayslipAccess(settingsData.employeePayslipAccess ?? true);
                
                setRoles(rolesData);
                const initialPermissions: Record<string, string[]> = {};
                rolesData.forEach(role => {
                    initialPermissions[role.id] = role.accessibleMenus || [];
                });
                setPermissions(initialPermissions);

                const existingMenuOrder = settingsData.menuOrder || [];
                const usedMenuIds = new Set(existingMenuOrder.flatMap(item => [item.id, ...(item.subItems || [])]));
                const newMenuItems = allMenus.filter(m => !usedMenuIds.has(m.id)).map(m => ({ id: m.id, isGroup: false, subItems: [] as string[] }));

                const finalOrder = [...existingMenuOrder, ...newMenuItems];
                // Ensure every item has isGroup and subItems properties
                const normalizedOrder = finalOrder.map(item => ({
                    ...item,
                    isGroup: !!item.isGroup,
                    subItems: item.subItems || [],
                }));

                setMenuOrder(normalizedOrder);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch settings data.' });
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);
    
    const lang = settings?.language || 'id';
    
    const availableMenus = useMemo(() => {
        const usedIds = new Set<string>();
        menuOrder.forEach(item => {
            if (item.isGroup) {
                item.subItems?.forEach(subId => usedIds.add(subId));
            } else {
                usedIds.add(item.id);
            }
        });
        return allMenus.filter(menu => !usedIds.has(menu.id));
    }, [menuOrder]);

    const addGroup = () => {
        const newGroup: MenuOrderItem = {
            id: `group-${Date.now()}`,
            isGroup: true,
            subItems: [],
        };
        setMenuOrder(prev => [...prev, newGroup]);
    };

    const removeMenuItem = (idToRemove: string, parentGroupId?: string) => {
        setMenuOrder(prev => {
            const newOrder = [...prev];
            if (parentGroupId) {
                const groupIndex = newOrder.findIndex(item => item.id === parentGroupId);
                if (groupIndex > -1) {
                    newOrder[groupIndex].subItems = newOrder[groupIndex].subItems?.filter(id => id !== idToRemove);
                }
            } else {
                return newOrder.filter(item => item.id !== idToRemove);
            }
            return newOrder;
        });
    };
    
    const removeGroup = (groupId: string) => {
        setMenuOrder(prev => prev.filter(item => item.id !== groupId));
    }


    const handlePermissionChange = (roleId: string, menuId: string, checked: boolean) => {
        setPermissions(prev => {
            const currentMenus = prev[roleId] || [];
            const newMenus = checked
                ? [...currentMenus, menuId]
                : currentMenus.filter(id => id !== menuId);
            return { ...prev, [roleId]: newMenus };
        });
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
             setLogoPreview(null);
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
                menuOrder,
                employeePayslipAccess,
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

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: MenuOrderItem) => {
        setDraggedItem(item);
        e.dataTransfer.setData('application/json', JSON.stringify({ item }));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDropOnList = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const { item: draggedItem, sourceIndex } = JSON.parse(data);

        // Remove from original position
        let newMenuOrder = [...menuOrder];
        if (sourceIndex !== undefined) {
            newMenuOrder.splice(sourceIndex, 1);
        }

        // Add to new position
        newMenuOrder.splice(targetIndex, 0, draggedItem);
        setMenuOrder(newMenuOrder);
    };

    const handleDropOnGroup = (e: React.DragEvent<HTMLDivElement>, groupId: string) => {
        e.stopPropagation();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        
        const { item: droppedItem, sourceGroupId } = JSON.parse(data);

        setMenuOrder(prev => {
            let newOrder = [...prev];

            // Remove from source (if any)
            if (sourceGroupId) {
                 const groupIndex = newOrder.findIndex(g => g.id === sourceGroupId);
                 if (groupIndex > -1) {
                     newOrder[groupIndex].subItems = (newOrder[groupIndex].subItems || []).filter(id => id !== droppedItem.id);
                 }
            } else {
                newOrder = newOrder.filter(item => item.id !== droppedItem.id);
            }

            // Add to target group
            const targetGroupIndex = newOrder.findIndex(g => g.id === groupId);
            if (targetGroupIndex > -1 && newOrder[targetGroupIndex].isGroup) {
                newOrder[targetGroupIndex].subItems = [...(newOrder[targetGroupIndex].subItems || []), droppedItem.id];
            }
            return newOrder;
        });
    };
    
    const handleDragStartSubItem = (e: React.DragEvent<HTMLDivElement>, subItemId: string, groupId: string) => {
        e.stopPropagation();
        const item = allMenus.find(m => m.id === subItemId);
        if (!item) return;
        
        const itemToDrag = { id: item.id, label: item.label };
        e.dataTransfer.setData('application/json', JSON.stringify({ item: itemToDrag, sourceGroupId: groupId }));
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
                                    onChange={handleFileChange}
                                    className="max-w-sm"
                                />
                            </div>
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
                        <CardTitle>Urutan Menu Sidebar</CardTitle>
                        <CardDescription>Seret dan lepas untuk mengatur urutan dan struktur menu di sidebar.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <h4 className="font-semibold">Menu Tersedia</h4>
                             <div className="space-y-2 rounded-md border p-2 min-h-[200px] bg-muted/30">
                                {availableMenus.map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, {id: item.id})}
                                        className="flex items-center gap-2 rounded-md p-2 bg-background hover:bg-muted cursor-grab border"
                                    >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                             <h4 className="font-semibold">Struktur Sidebar</h4>
                            <div 
                                className="space-y-2 rounded-md border p-2 min-h-[200px] bg-muted/30"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnList(e, menuOrder.length)}
                            >
                                {menuOrder.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, item) }}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => { e.stopPropagation(); handleDropOnList(e, index) }}
                                        className="flex items-center gap-2 rounded-md p-2 bg-background hover:bg-muted cursor-grab border"
                                    >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        {item.isGroup ? (
                                            <div 
                                                className="flex-1 p-2 border border-dashed rounded-md space-y-2"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDropOnGroup(e, item.id)}
                                            >
                                                <div className="flex justify-between items-center">
                                                   <span className="text-sm font-semibold text-muted-foreground">Grup Menu</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeGroup(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </div>
                                                <div className="pl-4 space-y-1 min-h-[20px]">
                                                    {(item.subItems || []).map(subId => (
                                                         <div key={subId} draggable onDragStart={(e) => handleDragStartSubItem(e, subId, item.id)} className="flex items-center gap-2 rounded-md p-1 bg-muted/50 cursor-grab border">
                                                            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                                            <span>{allMenus.find(m => m.id === subId)?.label}</span>
                                                             <Button type="button" variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => removeMenuItem(subId, item.id)}>
                                                                <Trash2 className="h-3 w-3 text-destructive"/>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                           <>
                                                <span>{allMenus.find(m => m.id === item.id)?.label || item.id}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => removeMenuItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                           </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Grup
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
                    <Button type="submit" disabled={loading || savingPermissions}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {lang === 'id' ? 'Simpan Semua Pengaturan' : 'Save All Settings'}
                    </Button>
                </div>
              </div>
            </form>
        </div>
    );
}
