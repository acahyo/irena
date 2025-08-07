
'use client';

import { useState } from 'react';
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
import { Upload } from 'lucide-react';

export default function SettingsPage() {
    const { toast } = useToast();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // In a real application, you would save these settings to a backend.
        // For now, we just show a success toast.
        toast({
            title: 'Success!',
            description: 'Settings have been saved.',
        });
    };

    const ColorInput = ({ label, id, defaultValue }: { label: string, id: string, defaultValue: string }) => (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    name={id}
                    defaultValue={defaultValue}
                    className="max-w-xs"
                />
                <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: defaultValue }}></div>
            </div>
             <p className="text-sm text-muted-foreground">
                Enter a valid CSS color (e.g., #RRGGBB, hsl(H, S%, L%)).
            </p>
        </div>
    );

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
                                    <AvatarImage src={logoPreview || "https://placehold.co/100x100/877795/FFFFFF"} alt="App Logo" className="object-contain" />
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
                            <Input id="appName" name="appName" defaultValue="Staff Hub" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="appDescription">Application Description</Label>
                            <Textarea id="appDescription" name="appDescription" defaultValue="An application for employee management." />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Theme Colors</CardTitle>
                                <CardDescription>
                                   To apply these colors, you would typically save them and dynamically update the CSS variables in `src/app/globals.css`.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <ColorInput label="Primary Color" id="primaryColor" defaultValue="hsl(173 70% 26%)" />
                               <ColorInput label="Background Color" id="backgroundColor" defaultValue="hsl(172 38% 87%)" />
                               <ColorInput label="Accent Color" id="accentColor" defaultValue="hsl(274 11% 53%)" />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end pt-4">
                            <Button type="submit">
                                Save Settings
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
