
'use client';

import { useState, useMemo } from 'react';
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
    
    const lang = settings.language || 'id';

    const T = useMemo(() => ({
        welcome: lang === 'id' ? 'Selamat datang kembali! Silakan masuk ke akun Anda.' : 'Welcome back! Please sign in to your account.',
        emailLabel: lang === 'id' ? 'Email' : 'Email',
        passwordLabel: lang === 'id' ? 'Kata Sandi' : 'Password',
        signInButton: lang === 'id' ? 'Masuk' : 'Sign In',
        signingInButton: lang === 'id' ? 'Sedang Masuk...' : 'Signing In...',
        defaultError: lang === 'id' ? 'Terjadi kesalahan tak terduga. Silakan coba lagi.' : 'An unexpected error occurred. Please try again.',
        authError: (msg: string) => {
            if (lang === 'id') {
                if (msg.toLowerCase().includes('invalid')) return 'Email atau kata sandi tidak valid.';
                if (msg.toLowerCase().includes('required')) return 'Email dan kata sandi wajib diisi.';
            }
            return msg;
        }
    }), [lang]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const result = await authenticateUser({ email, password });

        if (result.success) {
            if (result.userType === 'admin') {
                router.push('/dashboard');
            } else if (result.userType === 'employee') {
                router.push('/portal');
            }
        } else {
            setError(T.authError(result.message || T.defaultError));
        }
        setLoading(false);
    };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center pb-4">
               <Avatar className="h-[100px] w-[100px] rounded-lg">
                {settings.logo && <AvatarImage src={settings.logo} alt={settings.appName || 'Logo'} />}
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    <LogIn className="h-8 w-8" />
                </AvatarFallback>
            </Avatar>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {settings.appName}
            </CardTitle>
            <CardDescription>
              {T.welcome}
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
                <Label htmlFor="email">{T.emailLabel}</Label>
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
                <Label htmlFor="password">{T.passwordLabel}</Label>
                <Input id="password" name="password" type="password" required defaultValue="" disabled={loading} />
              </div>
              <Button type="submit" className="w-full !mt-6" disabled={loading}>
                {loading ? T.signingInButton : T.signInButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
