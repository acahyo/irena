
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
import { Loader2, Upload } from 'lucide-react';
import { getSettings, saveSettings } from '@/actions/settings';
import type { AppSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setPageLoading(true);
            try {
                const data = await getSettings();
                setSettings(data);
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
                setSettings(prev => prev ? { ...prev, logo: reader.result as string } : { logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        } else {
            setSettings(prev => prev ? { ...prev, logo: '' } : { logo: '' });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : { [name]: value } as AppSettings);
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!settings) return;
        setLoading(true);
        
        try {
            const { id, ...settingsToSave } = settings;
            await saveSettings(settingsToSave);

            // Update CSS variables dynamically
            const root = document.documentElement;
            if (settings.primaryColor) root.style.setProperty('--primary', hexToHslString(settings.primaryColor) || '');
            if (settings.backgroundColor) root.style.setProperty('--background', hexToHslString(settings.backgroundColor) || '');
            if (settings.accentColor) root.style.setProperty('--accent', hexToHslString(settings.accentColor) || '');

            toast({
                title: 'Success!',
                description: 'Settings have been saved.',
            });
            // A full page reload might be better to reflect all changes (like sidebar logo/name)
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
                                    <AvatarImage src={settings.logo || undefined} alt="App Logo" className="object-contain" />
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

                        <div className="space-y-2">
                            <Label htmlFor="appName">Application Name</Label>
                            <Input id="appName" name="appName" value={settings.appName} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="appDescription">Application Description</Label>
                            <Textarea id="appDescription" name="appDescription" value={settings.appDescription} onChange={handleInputChange} />
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
        </div>
    );
}
