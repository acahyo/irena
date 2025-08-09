

import { redirect } from 'next/navigation';
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
import { getSettings } from '@/actions/settings';
import { authenticateUser } from '@/actions/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoginPageClient from './login-client';


export default async function LoginPage() {
    const settings = await getSettings();

    return <LoginPageClient settings={settings} />;
}
