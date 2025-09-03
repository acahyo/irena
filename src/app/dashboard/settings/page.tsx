
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Upload, Download } from 'lucide-react';
import { getSettings, saveSettings } from '@/actions/settings';
import type { AppSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDepartments } from '@/actions/departments';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import { getPositions } from '@/actions/positions';
import { getRoles } from '@/actions/roles';
import { getUsers } from '@/actions/users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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


export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<Omit<AppSettings, 'logo' | 'id'> | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | undefined | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setPageLoading(true);
            try {
                const data = await getSettings();
                const { logo, id, ...rest } = data;
                setSettings(rest);
                setLogoPreview(logo);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch settings.' });
            } finally {
                setPageLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);

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
                roles, 
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
            zip.file("roles.json", JSON.stringify(roles, null, 2));
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
            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>
                        Manage your application's branding and appearance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <Label>Application Logo</Label>
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
                                <Label htmlFor="appName">Application Name</Label>
                                <Input id="appName" name="appName" value={settings.appName || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">Language</Label>
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
                            <Label htmlFor="appDescription">Application Description</Label>
                            <Textarea id="appDescription" name="appDescription" value={settings.appDescription || ''} onChange={handleInputChange} />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Theme Colors</CardTitle>
                                <CardDescription>
                                   Changes will be applied application-wide after saving.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <ColorInput label="Primary Color" id="primaryColor" value={settings.primaryColor || '#136F63'} onChange={handleInputChange} />
                               <ColorInput label="Background Color" id="backgroundColor" value={settings.backgroundColor || '#D2E9E6'} onChange={handleInputChange} />
                               <ColorInput label="Accent Color" id="accentColor" value={settings.accentColor || '#877795'} onChange={handleInputChange} />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Settings
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Data Backup</CardTitle>
                    <CardDescription>
                        Download all data from the Firestore database as a .zip file containing JSON files for each collection.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleDownloadBackup} disabled={downloading}>
                        {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {downloading ? 'Downloading...' : 'Download Data Backup (JSON)'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
