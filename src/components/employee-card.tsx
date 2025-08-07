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

interface EmployeeCardProps {
  employee: Employee;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Link href={`/dashboard/employees/${employee.id}`}>
      <Card className="h-full transform-gpu transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full truncate">
              <CardTitle className="truncate">{employee.name}</CardTitle>
              <CardDescription className="truncate">{employee.role}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>{employee.department}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
