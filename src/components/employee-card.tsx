
import Link from 'next/link';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone, Briefcase, Building } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Link href={`/dashboard/employees/${employee.id}`}>
      <Card className="h-full transform-gpu transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full truncate pt-4">
              <CardTitle className="truncate">{employee.name}</CardTitle>
              <CardDescription className="truncate">{employee.role || 'No position'}</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{employee.department || 'No department'}</span>
            </div>
             <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{employee.phone || 'No phone'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
