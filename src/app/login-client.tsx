'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle, User, Building } from 'lucide-react';
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
import Link from 'next/link';


export default function EmployeeLoginPageClient({ settings }: { settings: AppSettings }) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const lang = settings.language || 'id';

    const T = useMemo(() => ({
        welcome: lang === 'id' ? 'Selamat datang! Silakan masuk ke akun karyawan Anda.' : 'Selamat datang! Silakan masuk ke akun karyawan Anda.',
        emailLabel: lang === 'id' ? 'Email' : 'Email',
        passwordLabel: lang === 'id' ? 'Kata Sandi' : 'Password',
        signInButton: lang === 'id' ? 'Masuk' : 'Sign In',
        signingInButton: lang === 'id' ? 'Sedang Masuk...' : 'Sedang Masuk...',
        defaultError: lang === 'id' ? 'Terjadi kesalahan tak terduga. Silakan coba lagi.' : 'Terjadi kesalahan tak terduga. Silakan coba lagi.',
        notAdmin: lang === 'id' ? 'Bukan karyawan? Masuk sebagai Admin' : 'Not an employee? Sign in as Admin',
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

        const result = await authenticateUser({ email, password }, 'employee');

        if (result.success) {
            router.push('/portal');
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
                    <User className="h-8 w-8" />
                </AvatarFallback>
            </Avatar>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {lang === 'id' ? 'Portal Karyawan' : 'Portal Karyawan'}
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
                  placeholder="nama@irena.com"
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
             <div className="mt-4 text-center text-sm">
              <Link href="/" className="underline text-muted-foreground hover:text-primary">
                 <div className="flex items-center justify-center gap-1">
                    <Building className="h-4 w-4" /> {T.notAdmin}
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
