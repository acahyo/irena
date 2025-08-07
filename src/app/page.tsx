import { redirect } from 'next/navigation';
import { Building } from 'lucide-react';

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

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center pb-4">
              <div className="rounded-lg bg-primary p-3 text-primary-foreground">
                <Building className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Staff Hub
            </CardTitle>
            <CardDescription>
              Welcome back! Please sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                'use server';
                redirect('/dashboard');
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  defaultValue="admin@staffhub.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required defaultValue="password" />
              </div>
              <Button type="submit" className="w-full !mt-6">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
