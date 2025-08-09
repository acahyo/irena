
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authenticateUser } from '@/actions/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AppSettings } from '@/lib/types';


export default function LoginPageClient({ settings }: { settings: AppSettings }) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const result = await authenticateUser({ email, password });

        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center pb-4">
               <Avatar className="h-12 w-12 rounded-lg">
                {settings.logo && <AvatarImage src={settings.logo} alt={settings.appName || 'Logo'} />}
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    <LogIn className="h-6 w-6" />
                </AvatarFallback>
            </Avatar>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {settings.appName}
            </CardTitle>
            <CardDescription>
              Welcome back! Please sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  defaultValue=""
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required defaultValue="" disabled={loading} />
              </div>
              <Button type="submit" className="w-full !mt-6" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
