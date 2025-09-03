
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoles } from '@/actions/roles';
import { createUser } from '@/actions/users';
import { getEmployees } from '@/actions/employees';
import { getUsers } from '@/actions/users';
import type { Role, Employee, User } from '@/lib/types';


export default function NewUserPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const [fetchedRoles, fetchedEmployees, existingUsers] = await Promise.all([
                    getRoles(),
                    getEmployees(),
                    getUsers(),
                ]);

                const existingUserEmails = new Set(existingUsers.map(u => u.email));
                const availableEmployees = fetchedEmployees.filter(emp => emp.email && !existingUserEmails.has(emp.email));

                setRoles(fetchedRoles);
                setEmployees(availableEmployees);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to fetch initial data.',
                });
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEmployeeId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select an employee.',
            });
            return;
        }

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const role = formData.get('role') as string;
        const password = formData.get('password') as string;

        try {
            await createUser({ 
                name: selectedEmployee?.name || '', 
                email: selectedEmployee?.email || '', 
                role, 
                password 
            });
            toast({
                title: 'Success!',
                description: 'New user has been added.',
            });
            router.push('/dashboard/users');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add new user.',
            });
        } finally {
            setLoading(false);
        }
    };

  if (pageLoading) {
      return <p>Loading data...</p>
  }

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>
            Select an employee to create a user account for them.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="employee">Employee</Label>
                        <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                            <SelectTrigger id="employee">
                                <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.email})</SelectItem>
                                ))}
                                {employees.length === 0 && <p className="p-2 text-sm text-muted-foreground">No available employees found.</p>}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" value={selectedEmployee?.email || ''} readOnly disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" required>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !selectedEmployeeId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save User
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
