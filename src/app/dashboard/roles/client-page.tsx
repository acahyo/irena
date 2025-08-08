
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/lib/types';
import { getRoles, deleteRole } from '@/actions/roles';


export default function RolesClientPage({ initialRoles }: { initialRoles: Role[]}) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const { toast } = useToast();

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
      toast({
        title: 'Success!',
        description: 'Role has been deleted.',
      });
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete role.',
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Roles</CardTitle>
                <CardDescription>
                    Manage user roles and their permissions.
                </CardDescription>
            </div>
            <Button asChild>
                <Link href="/dashboard/roles/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Role
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length > 0 ? (
                roles.map((role) => (
                    <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/roles/${role.id}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </Link>
                                    </DropdownMenuItem>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                 <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the role.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(role.id)}>
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No roles found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
