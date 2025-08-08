
import Link from 'next/link';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone, Building, Calendar } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
}

const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'PP');
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Link href={`/dashboard/employees/${employee.id}`}>
      <Card className="h-full flex flex-col transform-gpu transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{employee.name ? employee.name.charAt(0) : '?'}</AvatarFallback>
            </Avatar>
            <div className="w-full truncate pt-4">
              <CardTitle className="truncate">{employee.name}</CardTitle>
              <CardDescription className="truncate">{employee.position || 'No position'}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
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
        <CardFooter className="flex-col items-start gap-2 text-xs text-muted-foreground border-t pt-4">
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Mulai: {formatDate(employee.contractStartDate)}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Selesai: {formatDate(employee.contractEndDate)}</span>
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
